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

const QUERIES = [
  "Rapunzel",
  "Rap",
  "RaPun",
  "Rapunzel Gifted",
  "gifted",
  "Merlin",
  "dragon",
  "charizard",
  "pikachu",
  "black lotus",
  "sol ring",
  "be prepared",
  "diablo",
];

const unit = spawnSync(
  "npm",
  [
    "run",
    "test",
    "--prefix",
    "frontend/runtime_console_v3",
    "--",
    "--run",
    "tests/features/search/gameConfig.r2.test.ts",
  ],
  { cwd: repoRoot, encoding: "utf8", shell: true, timeout: 120_000 },
);

const apiSearch = spawnSync(
  "npm",
  ["run", "test", "--prefix", "services/api", "--", "src/search/__tests__/searchProjection.test.ts"],
  { cwd: repoRoot, encoding: "utf8", shell: true, timeout: 120_000 },
);

async function main() {
  const httpResults = [];
  for (const q of QUERIES) {
    const t0 = performance.now();
    const probe = await httpProbe(`${BASE}/search?q=${encodeURIComponent(q)}`);
    httpResults.push({
      query: q,
      ok: probe.ok,
      status: probe.status,
      latencyMs: Math.round(performance.now() - t0),
      error: probe.error,
    });
  }

  const httpAny = httpResults.some((r) => r.ok);
  const searchScore =
    unit.status === 0 && apiSearch.status === 0 ? (httpAny ? 85 : 55) : unit.status === 0 ? 65 : 40;

  const report = {
    generatedAt: new Date().toISOString(),
  personaId: "eduardo-search",
  displayName: "Eduardo Lima",
  role: "Search Specialist",
  status: unit.status === 0 && apiSearch.status === 0 ? (httpAny ? "pass" : "warn") : "partial",
  searchScore,
  unitTests: { feGameConfig: unit.status === 0, apiProjection: apiSearch.status === 0 },
  queries: httpResults,
  facets: { note: "validar facets no browser — campanha média" },
  synonyms: { note: "cobertura parcial via gameConfig.r2" },
  automated: true,
  bugs: {
    p0: httpResults.filter((r) => !r.ok && !r.error?.includes("fetch")).map((r) => `HTTP ${r.status} for ${r.query}`),
    p1: !httpAny ? ["Search HTTP indisponível — stack offline"] : [],
    p2: [],
    p3: [],
  },
  };

  writePersonaReport(testingRoot, "eduardo-search", report);
  console.log(`Eduardo Search: score=${searchScore} status=${report.status}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
