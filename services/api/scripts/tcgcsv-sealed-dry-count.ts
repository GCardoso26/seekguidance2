/**
 * One-shot: count TCGCSV sealed items per game (no DB write).
 * Usage: npx tsx scripts/tcgcsv-sealed-dry-count.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { TcgCsvSealedProvider } from "../src/product-catalog/providers/sealed/TcgCsvSealedProvider.js";

function loadEnvFile() {
  const p = resolve(process.cwd(), ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    if (process.env[m[1]]) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}

loadEnvFile();

const provider = new TcgCsvSealedProvider();
const result = await provider.syncProducts({
  requestId: randomUUID(),
  mode: "full",
  dryRun: true,
});

const byGame = new Map<string, number>();
for (const item of result.items ?? []) {
  const g = String(item.game || item.gameCodes?.[0] || "?");
  byGame.set(g, (byGame.get(g) ?? 0) + 1);
}

const rows = [...byGame.entries()].sort((a, b) => b[1] - a[1]);
console.log(JSON.stringify({
  ok: result.ok,
  total: result.count,
  gamesWithItems: rows.length,
  byGame: Object.fromEntries(rows),
  errors: result.errors?.slice(0, 20) ?? [],
}, null, 2));

if (rows.length < 10) {
  console.error(`FAIL: expected ≥10 games with sealed items, got ${rows.length}`);
  process.exit(1);
}
