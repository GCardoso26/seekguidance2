#!/usr/bin/env node
/**
 * Campanha — gates ordenados:
 * Environment Audit (Ricardo) → Smoke → (Login/Seller manual ou Playwright)
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testingRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(testingRoot, "..");

function run(nodeScript, label) {
  const r = spawnSync(process.execPath, [nodeScript], {
    cwd: repoRoot,
    env: process.env,
    encoding: "utf8",
    stdio: "inherit",
  });
  if (r.status !== 0) {
    console.error(`\n✗ Campanha parada em: ${label}`);
    process.exit(r.status ?? 1);
  }
}

console.log("=== Campanha: Environment Audit (Ricardo Menezes) ===\n");
run(path.join(__dirname, "environment-audit.mjs"), "Environment Audit");

console.log("\n=== Campanha: Smoke ===\n");
run(path.join(testingRoot, "smoke", "smoke-readonly.mjs"), "Smoke");

console.log("\n✓ Gates OK — retomar campanha funcional a partir do Login (Marina Costa).");
console.log("  Ver checklist: testing/reports/environment-audit-latest.md § Ready To Resume");
