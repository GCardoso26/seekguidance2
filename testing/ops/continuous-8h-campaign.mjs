#!/usr/bin/env node
/**
 * Continuous 8h campaign harness (Marina + Carlos + Fernanda loops).
 * Does NOT mock. Does NOT wipe DB. Run supervised on local/staging.
 *
 * Usage:
 *   CONTINUOUS_HOURS=8 node testing/ops/continuous-8h-campaign.mjs
 *   CONTINUOUS_HOURS=0.05 node ...  # smoke of the harness
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testingRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(testingRoot, "..");
const outDir = path.join(testingRoot, "reports", "continuous-8h");
fs.mkdirSync(outDir, { recursive: true });

const hours = Number(process.env.CONTINUOUS_HOURS || "8");
const endAt = Date.now() + hours * 3600_000;
const loopMs = Number(process.env.CONTINUOUS_LOOP_MS || String(15 * 60_000));

const logPath = path.join(outDir, `run-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`);

function log(entry) {
  fs.appendFileSync(logPath, `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`);
  console.log(JSON.stringify(entry));
}

function run(label, cmd, args, cwd = repoRoot, timeoutMs = 180_000) {
  const r = spawnSync(cmd, args, {
    cwd,
    env: process.env,
    encoding: "utf8",
    shell: true,
    timeout: timeoutMs,
  });
  log({
    label,
    status: r.status,
    ok: r.status === 0,
    timedOut: r.error?.code === "ETIMEDOUT" || r.signal === "SIGTERM",
    tail: `${r.stdout || ""}\n${r.stderr || ""}`.slice(-800),
  });
  return r.status === 0;
}

log({ event: "start", hours, endAt: new Date(endAt).toISOString() });

let round = 0;
while (Date.now() < endAt) {
  round++;
  log({ event: "round_start", round });
  run("audit", "npm", ["run", "test:audit"], repoRoot, 120_000);
  run("gates", "npm", ["run", "test:campaign:gates"], repoRoot, 120_000);
  // Marina full lifecycle is heavy — smoke mode skips when CONTINUOUS_SMOKE=1
  if (process.env.CONTINUOUS_SMOKE !== "1") {
    run(
      "marina",
      "npm",
      ["run", "test:e2e:lifecycle"],
      path.join(repoRoot, "frontend", "runtime_console_v3"),
      300_000,
    );
  }
  run(
    "carlos",
    "npx",
    ["playwright", "test", "e2e/specs/buyer-lifecycle.spec.ts", "--project=chromium"],
    path.join(repoRoot, "frontend", "runtime_console_v3"),
    180_000,
  );
  if (process.env.CONTINUOUS_SMOKE !== "1") {
    run(
      "fernanda",
      "npx",
      ["playwright", "test", "e2e/specs/marketplace-filters.spec.ts", "--project=chromium"],
      path.join(repoRoot, "frontend", "runtime_console_v3"),
      180_000,
    );
  }
  log({ event: "round_end", round });
  if (Date.now() + loopMs >= endAt) break;
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Math.min(loopMs, endAt - Date.now()));
}

log({ event: "done", rounds: round, logPath });
console.log(`✓ continuous campaign finished → ${logPath}`);
