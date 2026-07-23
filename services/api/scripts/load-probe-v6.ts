/**
 * Lightweight HTTP load probe (no k6 required) against public surfaces.
 * Stages: 100 / 250 / 500 / 1000 concurrent GETs (batched).
 *
 * Usage:
 *   npx tsx scripts/load-probe-v6.ts
 *   $env:BASE_URL="https://judgetcg.com.br"; npx tsx scripts/load-probe-v6.ts
 */
import "dotenv/config";

const BASE = (process.env.BASE_URL ?? "https://judgetcg.com.br").replace(/\/$/, "");
const PATHS = ["/loja", "/marketplace/produtos", "/checkout", "/"];

interface StageResult {
  users: number;
  totalRequests: number;
  ok: number;
  fail: number;
  p50: number;
  p95: number;
  p99: number;
  meanMs: number;
  errors: string[];
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx] ?? 0;
}

async function hit(url: string): Promise<{ ok: boolean; ms: number; status: number; err?: string }> {
  const t0 = performance.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": "JudgeTCG-LoadProbe/1.0" },
      signal: AbortSignal.timeout(30_000),
    });
    return { ok: res.status < 500, ms: performance.now() - t0, status: res.status };
  } catch (e) {
    return {
      ok: false,
      ms: performance.now() - t0,
      status: 0,
      err: e instanceof Error ? e.message : String(e),
    };
  }
}

async function stage(users: number): Promise<StageResult> {
  const urls = Array.from({ length: users }, (_, i) => `${BASE}${PATHS[i % PATHS.length]}`);
  const batchSize = 50;
  const times: number[] = [];
  let ok = 0;
  let fail = 0;
  const errors: string[] = [];

  for (let i = 0; i < urls.length; i += batchSize) {
    const chunk = urls.slice(i, i + batchSize);
    const results = await Promise.all(chunk.map((u) => hit(u)));
    for (const r of results) {
      times.push(r.ms);
      if (r.ok) ok += 1;
      else {
        fail += 1;
        if (errors.length < 5) errors.push(`${r.status}:${r.err ?? "http"}`);
      }
    }
  }

  times.sort((a, b) => a - b);
  const meanMs = times.reduce((a, b) => a + b, 0) / Math.max(1, times.length);
  return {
    users,
    totalRequests: users,
    ok,
    fail,
    p50: Math.round(percentile(times, 50)),
    p95: Math.round(percentile(times, 95)),
    p99: Math.round(percentile(times, 99)),
    meanMs: Math.round(meanMs),
    errors,
  };
}

async function main(): Promise<void> {
  const stages = [100, 250, 500, 1000];
  const results: StageResult[] = [];
  for (const u of stages) {
    console.error(`stage_${u}_start`);
    results.push(await stage(u));
    console.error(`stage_${u}_done fail=${results.at(-1)?.fail}`);
  }

  const ok =
    results.every((r) => r.fail / r.totalRequests < 0.05) &&
    results.every((r) => r.p95 < 8000);

  const report = {
    ok,
    base: BASE,
    date: new Date().toISOString(),
    thresholds: { maxFailRate: 0.05, maxP95Ms: 8000 },
    stages: results,
  };
  console.log(JSON.stringify(report, null, 2));
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
