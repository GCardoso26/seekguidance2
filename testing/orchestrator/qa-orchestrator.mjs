#!/usr/bin/env node
/**
 * QA Orchestrator R4 — sequência fixa de personas + merge para Cursor handoff.
 *
 * ORCHESTRATOR_STOP_ON_FAIL=1 (default) para após audit/smoke falhar (exit 1, mas personas automatizadas rodam).
 * ORCHESTRATOR_SKIP_GATES=1 — pula smoke (não recomendado).
 * RENATO_SCALE — escala carga leve (default 1; use 0.05 em dev rápido).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mergeCampaignReports } from "./merge-reports.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testingRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(testingRoot, "..");
const runners = path.join(testingRoot, "personas", "runners");

const STOP = process.env.ORCHESTRATOR_STOP_ON_FAIL !== "0";
const SKIP_GATES = process.env.ORCHESTRATOR_SKIP_GATES === "1";

function runNode(script, label) {
  console.log(`\n=== ${label} ===\n`);
  const r = spawnSync(process.execPath, [script], {
    cwd: repoRoot,
    env: process.env,
    encoding: "utf8",
    stdio: "inherit",
  });
  return r.status === 0;
}

function runStep(script, label) {
  return runNode(path.join(runners, script), label);
}

function runPersonas() {
  runStep("marina-seller-stub.mjs", "Marina — Seller QA (stub)");
  runStep("carlos-buyer-stub.mjs", "Carlos — Buyer QA (stub)");
  runStep("fernanda-marketplace-stub.mjs", "Fernanda — Marketplace QA (stub)");
  runStep("juliana-ux-audit.mjs", "Juliana — UX Audit");
  runStep("eduardo-search-audit.mjs", "Eduardo — Search Audit");
  runStep("daniela-catalog-audit.mjs", "Daniela — Catalog Audit");
  runStep("renato-performance-audit.mjs", "Renato — Performance Audit");
}

console.log("=== QA Orchestrator R4 ===\n");

const startedAt = Date.now();

const auditOk = runNode(path.join(testingRoot, "audit", "environment-audit.mjs"), "Ricardo — Environment Audit");

let smokeOk = true;
if (!SKIP_GATES && auditOk) {
  smokeOk = runNode(path.join(testingRoot, "smoke", "smoke-readonly.mjs"), "Smoke");
} else if (!auditOk) {
  console.warn("\n⚠ Audit FAIL — Smoke omitido (stack não liberada)\n");
  smokeOk = false;
} else {
  console.warn("\n⚠ ORCHESTRATOR_SKIP_GATES=1 — smoke omitido\n");
}

runPersonas();

const { jsonPath, mdPath, readinessPath, trendsPath, archive } = mergeCampaignReports(testingRoot, {
  startedAt,
  endedAt: Date.now(),
  smokeOk,
  auditOk,
});
console.log(`\n✓ Campanha orquestrada`);
console.log(`  JSON: ${jsonPath}`);
console.log(`  Handoff Cursor: ${mdPath}`);
console.log(`  Release Readiness: ${readinessPath}`);
console.log(`  Quality Trends: ${trendsPath}`);
console.log(`  Histórico: testing/history/${archive.id}.json`);
console.log("\n→ Próximo passo: Market Review Board\n");

const campaignOk = auditOk && smokeOk;
if (!campaignOk && STOP) {
  process.exit(1);
}
process.exit(0);
