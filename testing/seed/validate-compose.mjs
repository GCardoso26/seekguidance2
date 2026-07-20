#!/usr/bin/env node
/**
 * Valida composição Archetype × Catalog (IDs legados + aliases).
 * Requer Node com --experimental-strip-types.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testingRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(testingRoot, "..");

function assertGuard() {
  const r = spawnSync(process.execPath, [path.join(testingRoot, "guards", "assert-not-beta.mjs"), "compose"], {
    cwd: repoRoot,
    env: process.env,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout || "");
    process.exit(r.status ?? 1);
  }
}

async function main() {
  assertGuard();
  const modUrl = pathToFileURL(path.join(testingRoot, "personas", "games", "index.ts")).href;
  const { getPersonaById, listAllPersonas, CANONICAL_ALIASES, resolveCanonicalAlias } = await import(modUrl);

  const required = Object.values(CANONICAL_ALIASES);
  const errors = [];

  for (const id of required) {
    const p = getPersonaById(id);
    if (!p) errors.push(`persona ausente: ${id}`);
    else if (!p.archetypeId) errors.push(`${id} sem archetypeId`);
    else if (!p.profile) errors.push(`${id} sem Behavior Profile`);
  }

  for (const [alias, id] of Object.entries(CANONICAL_ALIASES)) {
    const p = resolveCanonicalAlias(alias);
    if (!p || p.id !== id) errors.push(`alias quebrado: ${alias} → ${id}`);
  }

  const all = listAllPersonas();
  if (all.length < 20) errors.push(`esperado ≥20 personas, got ${all.length}`);

  const withProfile = all.filter((p) => p.profile).length;
  if (withProfile !== all.length) {
    errors.push(`Behavior Profile incompleto: ${withProfile}/${all.length}`);
  }

  if (errors.length) {
    console.error("✗ compose validation failed:");
    for (const e of errors) console.error("  -", e);
    process.exit(1);
  }

  console.log("✓ compose OK");
  console.log(`  personas: ${all.length}`);
  console.log(`  com profile: ${withProfile}`);
  console.log(`  seller-alpha → ${resolveCanonicalAlias("seller-alpha").id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
