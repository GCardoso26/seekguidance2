#!/usr/bin/env node
/**
 * Ricardo Menezes (SRE) — Environment Audit antes do Smoke.
 * Não entra no marketplace; valida processos, portas, env e artefatos mínimos.
 *
 * FAIL → exit 1 → Smoke não deve rodar (use run-campaign-gates.mjs ou test:campaign:gates).
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { httpProbe, parseUrlHostPort, tcpReachable } from "./lib/probes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testingRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(testingRoot, "..");
const reportsDir = path.join(testingRoot, "reports");

const BASE = (process.env.BASE_URL || process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);
const API_BASE = (process.env.API_URL || process.env.PUBLIC_API_URL || BASE).replace(/\/$/, "");
const SEARCH_HTTP = (process.env.SEARCH_URL || `${BASE}/search?q=healthcheck`).replace(/\/$/, "");

/** @typedef {{ id: string, label: string, status: 'pass'|'fail'|'warn', blocking: boolean, detail: string }} Check */

function resolveTestEnv() {
  const explicit = (process.env.JUDGE_TEST_ENV || process.env.TEST_ENV || "").trim().toLowerCase();
  if (["local", "ci", "staging", "beta", "production"].includes(explicit)) return explicit;
  const appMode = (process.env.APP_MODE || process.env.NEXT_PUBLIC_APP_MODE || "").trim().toLowerCase();
  const environment = (process.env.ENVIRONMENT || "").trim().toLowerCase();
  if (environment === "production" || appMode === "production") return "production";
  if (appMode === "beta" || process.env.JUDGE_BETA === "1") return "beta";
  if (process.env.CI === "true" || process.env.CI === "1") return "ci";
  if (appMode === "sandbox" || process.env.JUDGE_STAGING === "1") return "staging";
  return "local";
}

function assertGuard() {
  const r = spawnSync(process.execPath, [path.join(testingRoot, "guards", "assert-not-beta.mjs"), "audit"], {
    cwd: repoRoot,
    env: process.env,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout || "");
    process.exit(r.status ?? 1);
  }
}

/** @returns {Check[]} */
async function runChecks() {
  const checks = [];
  const testEnv = resolveTestEnv();
  const appMode = (process.env.APP_MODE || process.env.NEXT_PUBLIC_APP_MODE || "(unset)").trim();

  checks.push({
    id: "environment_guard",
    label: "Environment Guard (not beta/production)",
    status: testEnv === "beta" || testEnv === "production" ? "fail" : "pass",
    blocking: true,
    detail: `resolved env=${testEnv}`,
  });

  checks.push({
    id: "judge_test_env",
    label: "JUDGE_TEST_ENV / TEST_ENV",
    status: ["local", "ci", "staging"].includes(testEnv) ? "pass" : testEnv === "beta" || testEnv === "production" ? "fail" : "warn",
    blocking: true,
    detail: explicitOrInferred(testEnv),
  });

  checks.push({
    id: "app_mode",
    label: "APP_MODE",
    status: /beta|production/i.test(appMode) ? "fail" : "pass",
    blocking: true,
    detail: `APP_MODE=${appMode}`,
  });

  let baseUrlOk = false;
  try {
    new URL(BASE);
    baseUrlOk = true;
  } catch {
    baseUrlOk = false;
  }
  checks.push({
    id: "base_url",
    label: "BASE_URL",
    status: baseUrlOk ? "pass" : "fail",
    blocking: true,
    detail: BASE,
  });

  const feRoot = await httpProbe(`${BASE}/`);
  const feHealthApi = await httpProbe(`${BASE}/api/health`);
  const feHealth = await httpProbe(`${BASE}/health`);
  const runtimeUp = feRoot.ok || feHealthApi.ok || feHealth.ok;
  checks.push({
    id: "runtime_console",
    label: "Runtime Console (FE)",
    status: runtimeUp ? "pass" : "fail",
    blocking: true,
    detail: runtimeUp
      ? `ok status=${feHealthApi.status || feRoot.status || feHealth.status}`
      : `inacessível em ${BASE}`,
  });

  const apiHealth = await httpProbe(`${API_BASE}/api/health`);
  const apiHealthAlt = await httpProbe(`${API_BASE}/health`);
  const apiUp = apiHealth.ok || apiHealthAlt.ok;
  checks.push({
    id: "api",
    label: "API health",
    status: apiUp ? "pass" : runtimeUp ? "warn" : "fail",
    blocking: !runtimeUp,
    detail: apiUp ? `ok` : `sem health em ${API_BASE} (FE também down → blocking)`,
  });

  const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
  const redisParts = parseUrlHostPort(redisUrl, 6379);
  const redisTcp = redisParts ? await tcpReachable(redisParts.host, redisParts.port) : false;
  checks.push({
    id: "redis",
    label: "Redis",
    status: redisTcp ? "pass" : "fail",
    blocking: true,
    detail: redisTcp ? `${redisParts.host}:${redisParts.port}` : `sem TCP em ${redisUrl}`,
  });

  const dbUrl = process.env.DATABASE_URL || "";
  let pgTcp = false;
  if (dbUrl) {
    const pg = parseUrlHostPort(dbUrl, 5432);
    if (pg) pgTcp = await tcpReachable(pg.host, pg.port);
  } else {
    pgTcp = await tcpReachable("127.0.0.1", 5432);
  }
  checks.push({
    id: "postgresql",
    label: "PostgreSQL",
    status: pgTcp ? "pass" : "fail",
    blocking: true,
    detail: dbUrl ? "DATABASE_URL set + TCP" : "default 127.0.0.1:5432",
  });

  const searchPort = Number(process.env.OPENSEARCH_PORT || process.env.SEARCH_PORT || 9200);
  const searchHost = process.env.OPENSEARCH_HOST || process.env.SEARCH_HOST || "127.0.0.1";
  const searchTcp = await tcpReachable(searchHost, searchPort);
  const searchHttp = await httpProbe(SEARCH_HTTP.includes("?") ? SEARCH_HTTP : `${BASE}/search?q=healthcheck`);
  checks.push({
    id: "search",
    label: "Search (OpenSearch / HTTP)",
    status: searchTcp || searchHttp.ok ? "pass" : "fail",
    blocking: true,
    detail: searchHttp.ok
      ? `HTTP search ok`
      : searchTcp
        ? `TCP ${searchHost}:${searchPort}`
        : `sem TCP ${searchHost}:${searchPort} nem HTTP search`,
  });

  checks.push({
    id: "workers",
    label: "Workers / filas",
    status: redisTcp ? "warn" : "fail",
    blocking: false,
    detail: redisTcp
      ? "Redis up — workers não inspecionados (sem endpoint liveness dedicado)"
      : "Redis down — filas provavelmente indisponíveis",
  });

  const projectionProbe = await httpProbe(`${BASE}/search?q=Rapunzel`);
  const cardsProbe = await httpProbe(`${BASE}/cards?q=Rapunzel`);
  const projectionOk = projectionProbe.ok || cardsProbe.ok;
  checks.push({
    id: "projection",
    label: "Projection / catálogo indexado",
    status: projectionOk ? "pass" : runtimeUp ? "warn" : "fail",
    blocking: false,
    detail: projectionOk ? "search/cards respondeu" : "sem evidência de projeção Rapunzel",
  });

  checks.push({
    id: "storage",
    label: "Storage",
    status: "warn",
    blocking: false,
    detail: "não auditado automaticamente — validar em staging com upload real",
  });

  checks.push({
    id: "upload",
    label: "Upload",
    status: "warn",
    blocking: false,
    detail: "não auditado automaticamente — validar rota seller em campanha funcional",
  });

  const migStatus = dbUrl ? "warn" : "warn";
  checks.push({
    id: "migrations",
    label: "Migrations",
    status: migStatus,
    blocking: false,
    detail: dbUrl
      ? "DATABASE_URL presente — rode certify:db / migrate manualmente antes de campanha longa"
      : "DATABASE_URL ausente — não é possível verificar schema",
  });

  const registryTest = spawnSync(
    "npm",
    [
      "run",
      "test",
      "--prefix",
      "services/api",
      "--",
      "src/catalog/providers/__tests__/gameConfigRegistry.test.ts",
      "src/catalog/providers/__tests__/providerLifecycle.test.ts",
    ],
    { cwd: repoRoot, encoding: "utf8", shell: true, timeout: 120_000 },
  );
  const registryOk = registryTest.status === 0;
  checks.push({
    id: "provider_registry",
    label: "Provider Registry (CI artefato)",
    status: registryOk ? "pass" : "fail",
    blocking: true,
    detail: registryOk ? "registry + lifecycle tests OK" : "falha nos testes de provider",
  });

  checks.push({
    id: "game_configuration",
    label: "Game Configuration",
    status: registryOk ? "pass" : "fail",
    blocking: true,
    detail: registryOk ? "GameConfiguration registry OK" : "falha GameConfiguration",
  });

  return checks;
}

function explicitOrInferred(testEnv) {
  const explicit = (process.env.JUDGE_TEST_ENV || process.env.TEST_ENV || "").trim();
  return explicit ? `explicit=${explicit} (resolved ${testEnv})` : `inferred=${testEnv}`;
}

function scoreChecks(checks) {
  const scored = checks.filter((c) => c.status !== "warn");
  const passed = scored.filter((c) => c.status === "pass").length;
  return scored.length ? Math.round((passed / scored.length) * 100) : 0;
}

function buildReadyToResume(checks, smokeWouldRun) {
  const byId = Object.fromEntries(checks.map((c) => [c.id, c]));
  const line = (id, label) => {
    const c = byId[id];
    const done = c?.status === "pass";
    return `- [${done ? "x" : " "}] ${label}`;
  };
  const lines = [
    "## Ready To Resume",
    "",
    "Para retomar a campanha funcional (Marina Costa):",
    "",
    line("runtime_console", "Runtime Console UP"),
    line("api", "API HEALTHY"),
    line("redis", "Redis conectado"),
    line("search", "OpenSearch / Search HTTP"),
    line("projection", "Projection sincronizada (search Rapunzel/cards)"),
    line("base_url", "BASE_URL válida"),
    line("provider_registry", "Provider Registry (testes verdes)"),
    line("game_configuration", "Game Configuration (testes verdes)"),
    `- [ ] Smoke PASS`,
    "",
    smokeWouldRun ? "↓ Retomar a partir do **Login**" : "↓ Corrigir itens acima → `npm run test:campaign:gates`",
    "",
  ];
  return lines.join("\n");
}

function formatMarkdown(report) {
  const lines = [
    "# Environment Audit — Ricardo Menezes (SRE)",
    "",
    `_Gerado em ${report.generatedAt}_`,
    "",
    "| Métrica | Valor |",
    "| --- | --- |",
    `| Environment Score | **${report.environmentScore}%** |`,
    `| Blocking Issues | **${report.blockingIssues}** |`,
    `| Warnings | ${report.warnings} |`,
    `| Ready for Functional QA | **${report.readyForFunctionalQA ? "YES" : "NO"}** |`,
    "",
    "## Checks",
    "",
    "| Check | Status | Blocking | Detail |",
    "| --- | --- | --- | --- |",
  ];
  for (const c of report.checks) {
    lines.push(`| ${c.label} | ${c.status.toUpperCase()} | ${c.blocking ? "yes" : "no"} | ${c.detail} |`);
  }
  lines.push("", report.readyToResume, "");
  if (!report.readyForFunctionalQA) {
    lines.push("**Environment Audit FAIL** — Smoke não deve rodar.", "");
  }
  return lines.join("\n");
}

async function main() {
  assertGuard();
  const checks = await runChecks();
  const blockingFails = checks.filter((c) => c.blocking && c.status === "fail");
  const warnings = checks.filter((c) => c.status === "warn").length;
  const readyForFunctionalQA = blockingFails.length === 0;

  const report = {
    generatedAt: new Date().toISOString(),
    persona: "Ricardo Menezes (SRE)",
    baseUrl: BASE,
    apiUrl: API_BASE,
    environmentScore: scoreChecks(checks),
    blockingIssues: blockingFails.length,
    warnings,
    readyForFunctionalQA,
    checks,
    readyToResume: buildReadyToResume(checks, false),
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  const jsonPath = path.join(reportsDir, "environment-audit-latest.json");
  const mdPath = path.join(reportsDir, "environment-audit-latest.md");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(mdPath, formatMarkdown(report), "utf8");

  console.log(`Environment Score: ${report.environmentScore}%`);
  console.log(`Blocking Issues: ${report.blockingIssues}`);
  console.log(`Warnings: ${report.warnings}`);
  console.log(`Ready for Functional QA: ${report.readyForFunctionalQA ? "YES" : "NO"}`);
  console.log(`→ ${path.relative(repoRoot, jsonPath)}`);
  console.log(`→ ${path.relative(repoRoot, mdPath)}`);

  if (!readyForFunctionalQA) {
    console.error("\n✗ Environment Audit FAIL — Smoke não deve rodar.");
    console.error(report.readyToResume);
    process.exit(1);
  }
  console.log("\n✓ Environment Audit PASS — pode rodar Smoke (Marina).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
