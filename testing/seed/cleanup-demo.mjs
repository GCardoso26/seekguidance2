#!/usr/bin/env node
/** Cleanup demo/staging manifests. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testingRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(testingRoot, "..");

function assertGuard(op) {
  const r = spawnSync(process.execPath, [path.join(testingRoot, "guards", "assert-not-beta.mjs"), op], {
    cwd: repoRoot,
    env: { ...process.env, JUDGE_TEST_ENV: process.env.JUDGE_TEST_ENV || "staging" },
    encoding: "utf8",
  });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout || "");
    process.exit(r.status ?? 1);
  }
}

function main() {
  assertGuard("cleanup");
  const p = path.join(testingRoot, ".seed", "demo-run.json");
  if (fs.existsSync(p)) fs.unlinkSync(p);
  console.log("✓ cleanup-demo done");
}

main();
