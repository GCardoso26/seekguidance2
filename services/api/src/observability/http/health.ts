import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../../identity/http/httpHelpers.js";
import { metrics } from "../../platform/metrics/registry.js";

export interface HealthCheck {
  name: string;
  ok: boolean;
  detail?: string;
}

export interface HealthDeps {
  /** Optional dependency probes — omitted = not required (in-memory / local). */
  checkPostgres?: () => Promise<HealthCheck>;
  checkRedis?: () => Promise<HealthCheck>;
  checkMeilisearch?: () => Promise<HealthCheck>;
  checkOutbox?: () => Promise<HealthCheck>;
  checkWorkers?: () => Promise<HealthCheck>;
}

export async function evaluateReadiness(deps: HealthDeps): Promise<{
  ready: boolean;
  checks: HealthCheck[];
}> {
  const checks: HealthCheck[] = [];
  const runners: Array<() => Promise<HealthCheck>> = [];
  if (deps.checkPostgres) runners.push(deps.checkPostgres);
  if (deps.checkRedis) runners.push(deps.checkRedis);
  if (deps.checkMeilisearch) runners.push(deps.checkMeilisearch);
  if (deps.checkOutbox) runners.push(deps.checkOutbox);
  if (deps.checkWorkers) runners.push(deps.checkWorkers);

  if (runners.length === 0) {
    checks.push({ name: "process", ok: true, detail: "in_memory_mode" });
    return { ready: true, checks };
  }

  for (const run of runners) {
    try {
      checks.push(await run());
    } catch (err) {
      checks.push({
        name: "unknown",
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return { ready: checks.every((c) => c.ok), checks };
}

/**
 * Handles /health · /health/live · /health/ready · /metrics
 * Returns true when handled.
 */
export async function handleObservabilityHttp(
  deps: HealthDeps,
  _req: IncomingMessage,
  res: ServerResponse,
  path: string,
  method: string,
): Promise<boolean> {
  if (method !== "GET" && method !== "HEAD") return false;

  if (path === "/health/live") {
    sendJson(res, 200, { status: "live", ok: true });
    return true;
  }

  if (path === "/health/ready") {
    const { ready, checks } = await evaluateReadiness(deps);
    sendJson(res, ready ? 200 : 503, { status: ready ? "ready" : "not_ready", checks });
    return true;
  }

  if (path === "/health" || path === "/api/v1/health") {
    const { ready, checks } = await evaluateReadiness(deps);
    sendJson(res, 200, {
      status: ready ? "ok" : "degraded",
      live: true,
      ready,
      checks,
      sprint: "6",
    });
    return true;
  }

  if (path === "/metrics") {
    const body = metrics.toPrometheusText();
    res.writeHead(200, {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(body);
    return true;
  }

  return false;
}

/** Default in-memory readiness (all green). */
export function inMemoryHealthDeps(opts?: {
  outboxOk?: boolean;
}): HealthDeps {
  return {
    checkPostgres: async () => ({ name: "postgres", ok: true, detail: "in_memory" }),
    checkRedis: async () => ({ name: "redis", ok: true, detail: "in_memory" }),
    checkMeilisearch: async () => ({ name: "meilisearch", ok: true, detail: "in_memory" }),
    checkOutbox: async () => ({
      name: "outbox",
      ok: opts?.outboxOk ?? true,
      detail: "accessible",
    }),
    checkWorkers: async () => ({ name: "workers", ok: true, detail: "connected" }),
  };
}

/**
 * BUG-QA-001 — Checkout V2 readiness must probe real Postgres, not report `in_memory`.
 * Redis/Meili optional until wired; absent probes must not fake green as durable.
 */
export function postgresCheckoutHealthDeps(opts: {
  query: (sql: string) => Promise<unknown>;
  checkRedis?: () => Promise<HealthCheck>;
  checkOutbox?: () => Promise<HealthCheck>;
}): HealthDeps {
  return {
    checkPostgres: async () => {
      try {
        await opts.query("SELECT 1");
        return { name: "postgres", ok: true, detail: "checkout_sessions_durable" };
      } catch (err) {
        return {
          name: "postgres",
          ok: false,
          detail: err instanceof Error ? err.message : String(err),
        };
      }
    },
    checkRedis: opts.checkRedis,
    checkOutbox: opts.checkOutbox,
    checkWorkers: async () => ({
      name: "workers",
      ok: true,
      detail: "checkout_v2_api_process",
    }),
  };
}
