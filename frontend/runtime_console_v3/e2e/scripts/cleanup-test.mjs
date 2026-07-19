/**
 * Cleanup do seed:test — apaga manifest e dados marcados do run.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const seedDir = path.join(root, "e2e", ".seed");
const manifestPath = path.join(seedDir, "run.json");

function main() {
  if (!fs.existsSync(manifestPath)) {
    console.log("seed:test:cleanup — nada para apagar (manifest ausente)");
    return;
  }
  const seed = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  fs.unlinkSync(manifestPath);
  // limpa leftovers locais do run
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
