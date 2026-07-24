/**
 * ADR-016 — Sync sealed providers that now have verified packshot manifests:
 * yugioh, fab, gundam, sorcery.
 *
 * Usage (from services/api):
 *   node --env-file=.env --import tsx scripts/sync-packshot-allowlist-sealed.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { ProductCatalogSyncService } from "../src/product-catalog/application/ProductCatalogSyncService.js";
import { PostgresProductCatalogRepository } from "../src/product-catalog/persistence/PostgresProductCatalogRepository.js";
import { FabSealedProvider } from "../src/product-catalog/publishers/fab/provider.js";
import { YugiohSealedProvider } from "../src/product-catalog/publishers/yugioh/provider.js";
import { GundamSealedProvider } from "../src/product-catalog/publishers/gundam/provider.js";
import { SorcerySealedProvider } from "../src/product-catalog/publishers/sorcery/provider.js";

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

async function main(): Promise<void> {
  loadEnvFile(resolve(process.cwd(), ".env"));
  loadEnvFile(resolve(process.cwd(), "../../.env"));
  const databaseUrl = process.env.DATABASE_URL?.replace(/^postgresql\+asyncpg:/, "postgresql:");
  if (!databaseUrl) throw new Error("DATABASE_URL required");

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const repo = new PostgresProductCatalogRepository(pool);
    const service = new ProductCatalogSyncService(repo, pool);
    const providers = [
      new YugiohSealedProvider(),
      new FabSealedProvider(),
      new GundamSealedProvider(),
      new SorcerySealedProvider(),
    ];
    const result = await service.runJob("catalog.sync.sealed", providers, {
      requestId: randomUUID(),
      mode: "full",
    });
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
