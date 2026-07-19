/**
 * Cleanup do seed:test — apaga manifest e dados marcados do run.
 * Guard: nunca em beta/production.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const repoRoot = path.resolve(root, "../..");
const seedDir = path.join(root, "e2e", ".seed");
const manifestPath = path.join(seedDir, "run.json");

function assertNotBeta() {
  const guard = path.join(repoRoot, "testing", "guards", "assert-not-beta.mjs");
  if (!fs.existsSync(guard)) return;
  const r = spawnSync(process.execPath, [guard, "cleanup"], {
    cwd: repoRoot,
    env: process.env,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout || "cleanup blocked");
    process.exit(r.status ?? 1);
  }
}

function main() {
  assertNotBeta();
  if (!fs.existsSync(manifestPath)) {
    console.log("seed:test:cleanup — nada para apagar (manifest ausente)");
    return;
  }
  const seed = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  fs.unlinkSync(manifestPath);
  for (const f of fs.readdirSync(seedDir)) {
    if (
      f.startsWith(seed.runId) ||
      f.endsWith(".tmp") ||
      f === "last-product-name.txt" ||
      f.endsWith(".txt")
    ) {
      fs.unlinkSync(path.join(seedDir, f));
    }
  }
  console.log(`✓ apagado run ${seed.runId}`);
  console.log("✓ produtos / pedidos / categorias / estoque / carrinhos (manifest)");
}

main();
