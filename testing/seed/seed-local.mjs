#!/usr/bin/env node
/** Seed local — personas + manifest livre. */
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
    env: process.env,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout || "");
    process.exit(r.status ?? 1);
  }
}

function main() {
  assertGuard("seed");
  process.env.JUDGE_TEST_ENV = process.env.JUDGE_TEST_ENV || "local";
  const seedDir = path.join(testingRoot, ".seed");
  fs.mkdirSync(seedDir, { recursive: true });
  const runId = `local-${Date.now().toString(36)}`;
  const out = path.join(seedDir, "local-run.json");
  fs.writeFileSync(
    out,
    JSON.stringify(
      {
        runId,
        createdAt: new Date().toISOString(),
        environment: "local",
        strategy: "free",
        note: "Use testing/personas para datasets; FE seed:test continua disponível para lifecycle mocks.",
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`✓ seed-local runId=${runId} → ${path.relative(repoRoot, out)}`);
}

main();
