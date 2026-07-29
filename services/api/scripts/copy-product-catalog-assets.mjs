/**
 * tsc does not emit JSON loaded via readFileSync.
 * Copy manufacturer manifests + sealed source manifests next to compiled JS.
 */
import { cpSync, mkdirSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = join(root, "src", "product-catalog");
const distRoot = join(root, "dist", "product-catalog");

function walkFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkFiles(p, acc);
    else acc.push(p);
  }
  return acc;
}

function copyMatches(fromDir, toDir, predicate) {
  mkdirSync(toDir, { recursive: true });
  let n = 0;
  for (const file of walkFiles(fromDir)) {
    if (!predicate(file)) continue;
    const rel = relative(fromDir, file);
    const dest = join(toDir, rel);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(file, dest);
    n += 1;
  }
  return n;
}

const manifests = copyMatches(
  join(srcRoot, "manufacturers"),
  join(distRoot, "manufacturers"),
  (f) => f.endsWith("manifest.json"),
);

const sources = copyMatches(
  join(srcRoot, "sources"),
  join(distRoot, "sources"),
  () => true,
);

console.log(
  JSON.stringify({
    msg: "product_catalog_assets_copied",
    manufacturerManifests: manifests,
    sourceFiles: sources,
  }),
);

if (manifests < 1) {
  console.error("copy-product-catalog-assets: expected at least one manufacturer manifest.json");
  process.exit(1);
}
