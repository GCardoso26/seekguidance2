import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { ServiceHealth, ServiceHealthStatus } from "@/types/service-health";
import { isRedisRateLimitEnabled } from "@/lib/rate-limit-redis";
import { isSearchCacheEnabled } from "@/lib/search-cache";
import { FEATURES } from "@/lib/feature-flags";

export type { ServiceHealth, ServiceHealthStatus };

const API_BASE = (process.env.API_PROXY_TARGET || "https://seekguidance.onrender.com").replace(/\/$/, "");

type CheckResult = { status: string; latency: number; error?: string };

async function checkSupabaseCatalog(): Promise<CheckResult> {
  const start = Date.now();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { status: "skipped", latency: 0, error: "Supabase não configurado" };
  }

  try {
    // Catálogo em tcg_judge — exige schema exposto no PostgREST.
    const supabase = createClient(url, key, {
      auth: { persistSession: false },
      db: { schema: "tcg_judge" },
    });
    const { error } = await supabase.from("card_catalog").select("id").limit(1);
    if (error) throw error;
    return { status: "ok", latency: Date.now() - start };
  } catch (e) {
    return {
      status: "error",
      latency: Date.now() - start,
      error: e instanceof Error ? e.message : "database error",
    };
  }
}

async function checkApiHealth(): Promise<{
  catalogApi: CheckResult;
  databaseFromApi: CheckResult | null;
}> {
  const start = Date.now();
  const timeoutMs = Number(process.env.HEALTH_API_TIMEOUT_MS || 15000);
  try {
    const res = await fetch(`${API_BASE}/v1/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    const latency = Date.now() - start;
    if (!res.ok) {
      return {
        catalogApi: { status: "error", latency, error: `HTTP ${res.status}` },
        databaseFromApi: null,
      };
    }
    const data = (await res.json().catch(() => null)) as
      | { services?: { database?: string } }
      | null;
    const dbStatus = data?.services?.database;
    return {
      catalogApi: { status: "ok", latency },
      databaseFromApi:
        dbStatus === "ok"
          ? { status: "ok", latency }
          : dbStatus
            ? { status: "error", latency, error: `api.services.database=${dbStatus}` }
            : null,
    };
  } catch (e) {
    return {
      catalogApi: {
        status: "error",
        latency: Date.now() - start,
        error: e instanceof Error ? e.message : "api error",
      },
      databaseFromApi: null,
    };
  }
}

async function checkRedis(): Promise<CheckResult> {
  const start = Date.now();
  if (!isRedisRateLimitEnabled()) {
    return { status: "skipped", latency: 0, error: "Upstash não configurado" };
  }

  try {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    await redis.ping();
    return { status: "ok", latency: Date.now() - start };
  } catch (e) {
    return {
      status: "error",
      latency: Date.now() - start,
      error: e instanceof Error ? e.message : "redis error",
    };
  }
}

export async function GET() {
  const [supabaseDb, apiHealth, redis] = await Promise.all([
    checkSupabaseCatalog(),
    checkApiHealth(),
    checkRedis(),
  ]);

  // Se PostgREST não expõe tcg_judge, usar services.database da API (Postgres real).
  const database =
    supabaseDb.status === "ok"
      ? supabaseDb
      : apiHealth.databaseFromApi?.status === "ok"
        ? {
            status: "ok" as const,
            latency: apiHealth.databaseFromApi.latency,
            error: supabaseDb.error
              ? `supabase_direct_failed:${supabaseDb.error}; using_api_health`
              : undefined,
          }
        : supabaseDb.status === "skipped" && apiHealth.databaseFromApi
          ? apiHealth.databaseFromApi
          : supabaseDb.status === "skipped"
            ? supabaseDb
            : apiHealth.databaseFromApi || supabaseDb;

  const catalogApi = apiHealth.catalogApi;

  const services: ServiceHealth[] = [
    { name: "API Principal", status: catalogApi.status === "ok" ? "online" : "offline" },
    {
      name: "Banco de Dados",
      status: database.status === "ok" ? "online" : database.status === "skipped" ? "degraded" : "offline",
    },
    {
      name: "Redis (Upstash)",
      status: redis.status === "ok" ? "online" : redis.status === "skipped" ? "degraded" : "offline",
    },
  ];

  const hasCriticalIssue = catalogApi.status === "error" || database.status === "error";
  const status = hasCriticalIssue ? "degraded" : "ok";

  const body = {
    timestamp: new Date().toISOString(),
    status,
    version: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev",
    checks: {
      database,
      catalog_api: catalogApi,
      redis,
    },
    features: {
      redis_rate_limit: isRedisRateLimitEnabled(),
      search_cache: isSearchCacheEnabled(),
      wishlist_v2: FEATURES.WISHLIST_V2,
      shipping_v2: FEATURES.SHIPPING_V2,
    },
    services,
    checkedAt: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: hasCriticalIssue ? 503 : 200,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
