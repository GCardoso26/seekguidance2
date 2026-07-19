#!/usr/bin/env node
/**
 * Seed CI — personas determinísticas → manifest testing/.seed/ci-run.json
 * Nunca roda em beta/production.
 */
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
    console.error(r.stdout || "");
    console.error(r.stderr || "");
    process.exit(r.status ?? 1);
  }
  if (r.stdout) process.stdout.write(r.stdout);
}

function loadPersonasManifest() {
  // Inline minimal deterministic snapshot (avoids TS runtime in CI without strip-types)
  return {
    version: 1,
    strategy: "deterministic-personas",
    aliases: {
      "seller-alpha": "lorcana-store-alpha",
      "buyer-alpha": "lorcana-competitive-buyer",
      "collector-alpha": "lorcana-collector",
    },
    personas: [
      {
        id: "lorcana-store-alpha",
        email: "seller-alpha-lorcana@judgetcg.test",
        password: "PersonaSeller1!",
        role: "seller",
        game: "lorcana",
      },
      {
        id: "lorcana-competitive-buyer",
        email: "buyer-alpha-lorcana@judgetcg.test",
        password: "PersonaBuyer1!",
        role: "buyer",
        game: "lorcana",
      },
      {
        id: "lorcana-collector",
        email: "collector-alpha-lorcana@judgetcg.test",
        password: "PersonaCollector1!",
        role: "collector",
        game: "lorcana",
      },
      {
        id: "mtg-commander-store",
        email: "seller-alpha-mtg@judgetcg.test",
        password: "PersonaSeller1!",
        role: "seller",
        game: "mtg",
      },
    ],
  };
}

function main() {
  assertGuard("seed");
  const seedDir = path.join(testingRoot, ".seed");
  fs.mkdirSync(seedDir, { recursive: true });
  const runId = `ci-${Date.now().toString(36)}`;
  const payload = {
    runId,
    createdAt: new Date().toISOString(),
    environment: "ci",
    ...loadPersonasManifest(),
  };
  const out = path.join(seedDir, "ci-run.json");
  fs.writeFileSync(out, JSON.stringify(payload, null, 2), "utf8");

  // Bridge: also write FE e2e seed pointer (non-product)
  const feSeed = path.join(repoRoot, "frontend", "runtime_console_v3", "e2e", ".seed");
  fs.mkdirSync(feSeed, { recursive: true });
  fs.writeFileSync(
    path.join(feSeed, "personas-pointer.json"),
    JSON.stringify({ runId, source: "testing/.seed/ci-run.json", aliases: payload.aliases }, null, 2),
    "utf8",
  );

  console.log(`✓ seed-ci runId=${runId}`);
  console.log(`✓ personas determinísticas → ${path.relative(repoRoot, out)}`);
}

main();
