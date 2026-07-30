/**
 * Persist only TcgCsvSealedProvider (plan 1A) — skips other sealed providers.
 * Usage: npx tsx scripts/sync-tcgcsv-sealed-only.ts [--dry-run]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { ProductCatalogSyncService } from "../src/product-catalog/application/ProductCatalogSyncService.js";
import { createCatalogPgPool } from "../src/product-catalog/persistence/createCatalogPgPool.js";
import { PostgresProductCatalogRepository } from "../src/product-catalog/persistence/PostgresProductCatalogRepository.js";
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

const dryRun = process.argv.includes("--dry-run");
const pool = createCatalogPgPool({ max: 3 });
const repo = new PostgresProductCatalogRepository(pool);
const service = new ProductCatalogSyncService(repo, pool);
const provider = new TcgCsvSealedProvider();

try {
  const result = await service.runJob("catalog.sync.sealed", [provider], {
    requestId: randomUUID(),
    mode: "full",
    dryRun,
  });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
} finally {
  await pool.end();
}
