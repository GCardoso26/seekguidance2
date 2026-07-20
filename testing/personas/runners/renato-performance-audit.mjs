#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { httpProbe } from "../../audit/lib/probes.mjs";
import { baseUrl, writePersonaReport } from "./lib/report.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testingRoot = path.resolve(__dirname, "../..");
const repoRoot = path.resolve(testingRoot, "..");
const BASE = baseUrl();

function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

function stats(latencies) {
  const ok = latencies.filter((l) => l.ok);
  const ms = ok.map((l) => l.ms).sort((a, b) => a - b);
  if (ms.length === 0) {
    return { count: latencies.length, ok: 0, avgMs: null, p95Ms: null, p99Ms: null };
  }
  const sum = ms.reduce((a, b) => a + b, 0);
  return {
    count: latencies.length,
    ok: ms.length,
    avgMs: Math.round(sum / ms.length),
    p95Ms: percentile(ms, 95),
    p99Ms: percentile(ms, 99),
  };
}

async function timedProbe(url) {
  const t0 = performance.now();
  const probe = await httpProbe(url, { timeoutMs: 8000 });
  return { ok: probe.ok, status: probe.status, ms: Math.round(performance.now() - t0), error: probe.error };
}

async function runBatch(label, urls) {
  const latencies = [];
  for (const url of urls) {
    latencies.push(await timedProbe(url));
  }
  return { label, ...stats(latencies), sample: latencies.slice(0, 5) };
}

async function main() {
  const scale = Number(process.env.RENATO_SCALE || "1");
  const nSearch = Math.max(1, Math.round(100 * scale));
  const nPdp = Math.max(1, Math.round(500 * scale));
  const nFilter = Math.max(1, Math.round(200 * scale));
  const nCart = Math.max(1, Math.round(100 * scale));

  const queries = ["Rapunzel", "charizard", "black lotus", "pikachu", "lorcana", "diablo"];
  const searchUrls = Array.from({ length: nSearch }, (_, i) =>
    `${BASE}/search?q=${encodeURIComponent(queries[i % queries.length])}`,
  );
  const pdpUrls = Array.from({ length: nPdp }, (_, i) =>
    `${BASE}/loja/cartas/${encodeURIComponent(["rapunzel", "charizard", "pikachu"][i % 3])}`,
  );
  const filterUrls = Array.from({ length: nFilter }, (_, i) =>
    `${BASE}/search?q=charizard&game=${encodeURIComponent(["lorcana", "pokemon", "magic"][i % 3])}`,
  );
  const cartPath = process.env.RENATO_CART_PATH || "/carrinho";
  const cartUrls = Array.from({ length: nCart }, () => `${BASE}${cartPath}`);

  // Warm-up — 1ª visita compila rota; medições refletem uso real pós-cache dev.
  await timedProbe(`${BASE}${cartPath}`);

  const budget = spawnSync(
    "npm",
    ["run", "test", "--prefix", "services/api", "--", "src/ops/__tests__/performanceBudget.test.ts"],
    { cwd: repoRoot, encoding: "utf8", shell: true, timeout: 120_000 },
  );

  const workloads = [
    await runBatch("search", searchUrls),
    await runBatch("pdp", pdpUrls),
    await runBatch("filters", filterUrls),
    await runBatch("cart", cartUrls),
  ];

  const anyOk = workloads.some((w) => w.ok > 0);
  const report = {
    generatedAt: new Date().toISOString(),
    personaId: "renato-performance",
    displayName: "Renato Oliveira",
    role: "Performance Auditor",
    status: budget.status === 0 && anyOk ? "pass" : budget.status === 0 ? "warn" : "partial",
    lightLoadOnly: true,
    scale,
    workloads,
    infrastructure: {
      cpu: { note: "não coletado — usar observabilidade do host em staging" },
      ram: { note: "não coletado — usar observabilidade do host em staging" },
      redis: { note: "ver Environment Audit (Ricardo)" },
      openSearch: { note: "ver Environment Audit (Ricardo)" },
    },
    budgetUnitTests: budget.status === 0,
    automated: true,
    bugs: {
      p0: [],
      p1: !anyOk ? ["Stack HTTP indisponível — latências não representam produção"] : [],
      p2: workloads.filter((w) => w.ok > 0 && w.p95Ms != null && w.p95Ms > 2000).map((w) => `${w.label} P95>${w.p95Ms}ms`),
      p3: [],
    },
  };

  writePersonaReport(testingRoot, "renato-performance", report);
  console.log(`Renato Performance: status=${report.status} scale=${scale}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
