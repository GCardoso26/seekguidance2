#!/usr/bin/env node
/**
 * Valida catálogo de personas + aliases canônicos (sem Playwright/browser).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testingRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(testingRoot, "..");

function assertGuard() {
  const r = spawnSync(process.execPath, [path.join(testingRoot, "guards", "assert-not-beta.mjs"), "personas"], {
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
  assertGuard();
  spawnSync(process.execPath, [path.join(testingRoot, "seed", "seed-personas.mjs")], {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
  });

  const catalogPath = path.join(testingRoot, "fixtures", "personas-catalog.json");
  if (!fs.existsSync(catalogPath)) {
    console.error("✗ personas-catalog.json ausente");
    process.exit(1);
  }
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const required = ["seller-alpha", "buyer-alpha", "collector-alpha"];
  const errors = [];

  for (const alias of required) {
    if (!catalog.aliases?.[alias]) errors.push(`alias faltando: ${alias}`);
    if (!catalog.credentials?.[alias]?.email) errors.push(`credencial faltando: ${alias}`);
    if (!catalog.credentials?.[alias]?.password) errors.push(`senha faltando: ${alias}`);
  }

  if (!Array.isArray(catalog.games) || catalog.games.length < 8) {
    errors.push(`games incompleto (esperado ≥8, got ${catalog.games?.length})`);
  }

  if (errors.length) {
    console.error("✗ validação de personas falhou:");
    for (const e of errors) console.error("  -", e);
    process.exit(1);
  }

  console.log("✓ personas OK");
  console.log(`  aliases: ${required.join(", ")}`);
  console.log(`  games: ${catalog.games.join(", ")}`);
  console.log(`  seller-alpha → ${catalog.aliases["seller-alpha"]} <${catalog.credentials["seller-alpha"].email}>`);
}

main();
