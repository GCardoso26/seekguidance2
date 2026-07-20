#!/usr/bin/env node
/**
 * Gera dashboards/relatórios ops (engenharia) em testing/reports/.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testingRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(testingRoot, "..");
const apiRoot = path.join(repoRoot, "services", "api");
const runner = path.join(apiRoot, "src", "catalog", "ops", "runGenerateOpsReports.ts");

function assertGuard() {
  const r = spawnSync(process.execPath, [path.join(testingRoot, "guards", "assert-not-beta.mjs"), "ops-reports"], {
    cwd: repoRoot,
    env: process.env,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout || "");
    process.exit(r.status ?? 1);
  }
}

function main() {
  assertGuard();
  const r = spawnSync("npx", ["tsx", runner], {
    cwd: apiRoot,
    env: process.env,
    encoding: "utf8",
    shell: true,
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  process.exit(r.status ?? 1);
}

main();
