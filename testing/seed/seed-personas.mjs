#!/usr/bin/env node
/** seed-personas — exporta snapshot JSON de todas as personas (sem DB). */
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
    env: process.env,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout || "");
    process.exit(r.status ?? 1);
  }
}

function main() {
  assertGuard("personas");
  const fixturesDir = path.join(testingRoot, "fixtures");
  fs.mkdirSync(fixturesDir, { recursive: true });
  // Copia catálogo estático mínimo para Playwright (sem import TS)
  const catalog = {
    exportedAt: new Date().toISOString(),
    games: [
      "lorcana",
      "mtg",
      "pokemon",
      "onepiece",
      "digimon",
      "dragonball",
      "riftbound",
      "naruto",
    ],
    aliases: {
      "seller-alpha": "lorcana-store-alpha",
      "buyer-alpha": "lorcana-competitive-buyer",
      "collector-alpha": "lorcana-collector",
    },
    credentials: {
      "seller-alpha": {
        email: "seller-alpha-lorcana@judgetcg.test",
        password: "PersonaSeller1!",
      },
      "buyer-alpha": {
        email: "buyer-alpha-lorcana@judgetcg.test",
        password: "PersonaBuyer1!",
      },
      "collector-alpha": {
        email: "collector-alpha-lorcana@judgetcg.test",
        password: "PersonaCollector1!",
      },
    },
  };
  const out = path.join(fixturesDir, "personas-catalog.json");
  fs.writeFileSync(out, JSON.stringify(catalog, null, 2), "utf8");
  console.log(`✓ seed-personas → ${path.relative(repoRoot, out)}`);
}

main();
