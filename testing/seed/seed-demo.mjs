#!/usr/bin/env node
/** Seed staging/demo — dados de demonstração (não mercado). */
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
  assertGuard("seed");
  const seedDir = path.join(testingRoot, ".seed");
  fs.mkdirSync(seedDir, { recursive: true });
  const runId = `demo-${Date.now().toString(36)}`;
  fs.writeFileSync(
    path.join(seedDir, "demo-run.json"),
    JSON.stringify(
      {
        runId,
        environment: "staging",
        strategy: "demo",
        createdAt: new Date().toISOString(),
        note: "Demo only — never write to beta/prod DBs that feed LPC/LCS.",
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`✓ seed-demo / seed-staging runId=${runId}`);
}

main();
