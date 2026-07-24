/**
 * One-shot: sync only lorcana-json-sealed against DATABASE_URL (loads .env).
 * Usage: npx tsx scripts/sync-lorcana-sealed-only.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { ProductCatalogSyncService } from "../src/product-catalog/application/ProductCatalogSyncService.js";
import { PostgresProductCatalogRepository } from "../src/product-catalog/persistence/PostgresProductCatalogRepository.js";
import { LorcanaJsonSealedProvider } from "../src/product-catalog/providers/sealed/LorcanaJsonSealedProvider.js";

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

async function main() {
  loadEnvFile();
  const databaseUrl = process.env.DATABASE_URL?.replace(/^postgresql\+asyncpg:/, "postgresql:");
  if (!databaseUrl) throw new Error("DATABASE_URL required");
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const repo = new PostgresProductCatalogRepository(pool);
    const service = new ProductCatalogSyncService(repo, pool);
    const result = await service.runJob("catalog.sync.sealed", [new LorcanaJsonSealedProvider()], {
      requestId: randomUUID(),
      mode: "full",
    });
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
