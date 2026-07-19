#!/usr/bin/env node
/**
 * Pipeline CI de testing:
 * seed-ci → seed-personas → (Playwright opcional via FE) → smoke → cleanup-ci
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testingRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(testingRoot, "..");

function run(script, args = []) {
  const r = spawnSync(process.execPath, [path.join(testingRoot, script), ...args], {
    cwd: repoRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      JUDGE_TEST_ENV: process.env.JUDGE_TEST_ENV || "ci",
      CI: process.env.CI || "1",
      // Sem servidor local, smoke não deve derrubar o pipeline de infra.
      SMOKE_SOFT: process.env.SMOKE_STRICT === "1" ? "0" : process.env.SMOKE_SOFT || "1",
    },
  });
  return r.status ?? 1;
}

let code = run("guards/assert-not-beta.mjs", ["seed"]);
if (code === 0) code = run("seed/seed-ci.mjs");
if (code === 0) code = run("seed/seed-personas.mjs");
if (code === 0) code = run("seed/validate-personas.mjs");
if (code === 0) code = run("smoke/smoke-readonly.mjs");
const cleanup = run("seed/cleanup-ci.mjs");
process.exit(code !== 0 ? code : cleanup);
