/**
 * seed → Playwright lifecycle → cleanup (cross-platform).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: true, env: process.env });
  return r.status ?? 1;
}

let code = run(npm, ["run", "seed:test"]);
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
