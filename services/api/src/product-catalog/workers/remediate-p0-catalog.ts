/**
 * P0 remediation: bootstrap provider_registry + sync manufacturer manifests + link listings.
 * Usage: npx tsx src/product-catalog/workers/remediate-p0-catalog.ts
 * Env: DATABASE_URL (postgresql://… — strips +asyncpg if present)
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import { createProviderScheduler } from "../scheduler/ProviderScheduler.js";
import { ProductCatalogSyncService } from "../application/ProductCatalogSyncService.js";
import { PostgresProductCatalogRepository } from "../persistence/PostgresProductCatalogRepository.js";
import { productCatalogProviderRegistry } from "../providers/registry.js";
import type { ProductCatalogJobKey } from "../providers/ProductCatalogProvider.js";
import { createMasterListingLinkService } from "../application/MasterListingLinkService.js";

function loadEnvFile() {
  const p = resolve(process.cwd(), ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    if (process.env[m[1]]) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}

function pgUrl(raw: string): string {
  return raw.replace(/^postgresql\+asyncpg:/, "postgresql:");
}

const MANUFACTURER_JOBS: ProductCatalogJobKey[] = [
  "catalog.sync.sleeves",
  "catalog.sync.deckboxes",
  "catalog.sync.binders",
  "catalog.sync.dice",
  "catalog.sync.counters",
  "catalog.sync.playmats",
];

async function main() {
  loadEnvFile();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL required");
  const pool = new Pool({ connectionString: pgUrl(databaseUrl) });
  const requestId = getIdGenerator().generate();

  try {
    const scheduler = createProviderScheduler(pool);
    await scheduler.syncFromMemoryRegistry();
    const regCount = await pool.query(`SELECT count(*)::int AS n FROM product_catalog.provider_registry`);
    console.log(JSON.stringify({ step: "bootstrap", providers: regCount.rows[0].n }));

    const repo = new PostgresProductCatalogRepository(pool);
    const sync = new ProductCatalogSyncService(repo, pool);
    const syncResults: Array<{ job: string; upserted: number; ok: boolean; errors: string[] }> = [];

    for (const jobKey of MANUFACTURER_JOBS) {
      const providers = productCatalogProviderRegistry.getProvidersForJob(jobKey);
      const result = await sync.runJob(jobKey, providers, {
        mode: "full",
        requestId,
        dryRun: false,
      });
      syncResults.push({
        job: jobKey,
        upserted: result.upserted,
        ok: result.ok,
        errors: result.errors.slice(0, 5),
      });
      console.log(
        JSON.stringify({
          step: "sync",
          job: jobKey,
          upserted: result.upserted,
          ok: result.ok,
          errorCount: result.errors.length,
        }),
      );
    }

    const products = await pool.query(`SELECT count(*)::int AS n FROM product_catalog.products`);
    const variants = await pool.query(`SELECT count(*)::int AS n FROM product_catalog.variants`);

    const linker = createMasterListingLinkService(pool);
    const link = await linker.linkUnmatchedListings({ limit: 5000 });

    console.log(
      JSON.stringify({
        step: "done",
        products: products.rows[0].n,
        variants: variants.rows[0].n,
        linked: link.linked,
        skipped: link.skipped,
        syncResults,
      }),
    );
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
