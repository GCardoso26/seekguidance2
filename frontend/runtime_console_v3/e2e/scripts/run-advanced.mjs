/**
 * Pipeline avançado local:
 * seed → lifecycle + negatives + edge + perf + multi-tcg + perms → visual (opt) → cleanup
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

const specs = [
  "e2e/specs/seller-lifecycle.spec.ts",
  "e2e/specs/seller-negatives.spec.ts",
  "e2e/specs/seller-edge-cases.spec.ts",
  "e2e/specs/seller-dashboard-perf.spec.ts",
  "e2e/specs/seller-multi-tcg.spec.ts",
  "e2e/specs/seller-permissions.spec.ts",
];

const includeVisual = process.env.E2E_VISUAL === "1" || process.argv.includes("--visual");

let code = run(npm, ["run", "seed:test"]);
if (code === 0) {
  code = run(npx, ["playwright", "test", ...specs, "--project=chromium"]);
}
if (code === 0 && includeVisual) {
  code = run(npx, [
    "playwright",
    "test",
    "e2e/specs/visual-regression.spec.ts",
    "--project=chromium",
  ]);
}
const cleanup = run(npm, ["run", "seed:test:cleanup"]);
process.exit(code !== 0 ? code : cleanup);
