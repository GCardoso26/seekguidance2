/**
 * seed → Playwright lifecycle → cleanup (cross-platform).
 * Guard: bloqueia beta/production antes de qualquer passo.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const repoRoot = path.resolve(root, "../..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: true, env: process.env });
  return r.status ?? 1;
}

function assertPlaywrightAllowed() {
  const guard = path.join(repoRoot, "testing", "guards", "assert-not-beta.mjs");
  if (!fs.existsSync(guard)) return 0;
  return spawnSync(process.execPath, [guard, "playwright"], {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
  }).status ?? 1;
}

let code = assertPlaywrightAllowed();
if (code === 0) code = run(npm, ["run", "seed:test"]);
if (code === 0) {
  code = run(npx, [
    "playwright",
    "test",
    "e2e/specs/seller-lifecycle.spec.ts",
    "--project=chromium",
  ]);
}
const cleanup = run(npm, ["run", "seed:test:cleanup"]);
process.exit(code !== 0 ? code : cleanup);
