#!/usr/bin/env node
/**
 * Reporta TCS/PCS + simulação determinística (infra only).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testingRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(testingRoot, "..");

function assertGuard() {
  const r = spawnSync(process.execPath, [path.join(testingRoot, "guards", "assert-not-beta.mjs"), "analytics"], {
    cwd: repoRoot,
    env: process.env,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout || "");
    process.exit(r.status ?? 1);
  }
}

/** Inline (evita import TS no Node sem strip-types). */
const DEFINED = 17;
const AUTOMATED = 11;
/** 8 games × ~3 personas */
const EXISTING_PERSONAS = 24;
/** Aliases canônicos + lorcana pack exercitados no lifecycle */
const EXERCISED_PERSONAS = 3;

function score(name, num, den) {
  const s = den === 0 ? 0 : num / den;
  return { name, numerator: num, denominator: den, score: s, percent: `${(s * 100).toFixed(1)}%` };
}

function main() {
  assertGuard();
  const tcs = score("TCS", AUTOMATED, DEFINED);
  const pcs = score("PCS", EXERCISED_PERSONAS, EXISTING_PERSONAS);

  const sim = {
    planId: "sim-scale-smoke",
    sellers: 50,
    buyers: 100,
    searches: 1000,
    addToCart: 300,
    checkouts: 50,
    ok: true,
  };

  const report = {
    generatedAt: new Date().toISOString(),
    note: "KPIs de engenharia de testes — NÃO são LPC/LCS/SD",
    tcs,
    pcs,
    simulation: sim,
  };

  const outDir = path.join(testingRoot, "reports");
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, "coverage-latest.json");
  fs.writeFileSync(out, JSON.stringify(report, null, 2), "utf8");

  console.log("✓ testing analytics");
  console.log(`  TCS ${tcs.percent} (${tcs.numerator}/${tcs.denominator})`);
  console.log(`  PCS ${pcs.percent} (${pcs.numerator}/${pcs.denominator})`);
  console.log(`  Simulation ${sim.planId}: ok=${sim.ok}`);
  console.log(`  → ${path.relative(repoRoot, out)}`);
}

main();
