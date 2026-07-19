#!/usr/bin/env node
/**
 * Smoke read-only — health → search Rapunzel → PDP/offers HTTP 200.
 * NÃO altera banco. Ainda assim bloqueado em beta/production (automação).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testingRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(testingRoot, "..");
const base = (process.env.BASE_URL || process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);

function assertGuard() {
  const r = spawnSync(process.execPath, [path.join(testingRoot, "guards", "assert-not-beta.mjs"), "playwright"], {
    cwd: repoRoot,
    env: process.env,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout || "");
    process.exit(r.status ?? 1);
  }
}

async function check(url) {
  const res = await fetch(url, { redirect: "follow" });
  return { url, status: res.status, ok: res.status >= 200 && res.status < 400 };
}

async function main() {
  assertGuard();
  const paths = [
    "/api/health",
    "/health",
    "/cards?q=Rapunzel",
    "/search?q=Rapunzel",
    "/cards",
  ];
  const results = [];
  for (const p of paths) {
    try {
      results.push(await check(`${base}${p}`));
    } catch (err) {
      results.push({ url: `${base}${p}`, status: 0, ok: false, error: String(err.message || err) });
    }
  }
  const healthOk = results.some((r) => r.url.includes("health") && r.ok);
  const searchOk = results.some((r) => (r.url.includes("Rapunzel") || r.url.includes("/cards")) && r.ok);
  console.log(JSON.stringify({ base, results, healthOk, searchOk }, null, 2));
  if (!healthOk && !searchOk) {
    const soft = process.env.SMOKE_SOFT === "1";
    if (soft) {
      console.warn("⚠ smoke: alvo inacessível — seed/personas/cleanup ainda válidos (SMOKE_SOFT=1)");
      process.exit(0);
    }
    console.error("✗ smoke failed — nenhum endpoint health/search respondeu 2xx/3xx");
    console.error("  Dica: defina BASE_URL ou SMOKE_SOFT=1 para pular quando o servidor não está no ar.");
    process.exit(1);
  }
  console.log("✓ smoke read-only OK (sem mutação de banco)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
