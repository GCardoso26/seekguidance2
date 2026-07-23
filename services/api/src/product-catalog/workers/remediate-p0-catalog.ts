/**
 * P0 remediation: bootstrap provider_registry + sync sealed + manufacturer manifests + link listings.
 * Usage: npx tsx src/product-catalog/workers/remediate-p0-catalog.ts [--sealed-only|--accessories-only]
 * Env: DATABASE_URL (postgresql://… — strips +asyncpg if present)
 *      SEED_STORE_ID (optional) — publish first sealed/accessory variants to this store
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

/** Sealed first — was previously omitted (root cause of empty sealed catalog). */
const SEALED_JOBS: ProductCatalogJobKey[] = ["catalog.sync.sealed"];

const MANUFACTURER_JOBS: ProductCatalogJobKey[] = [
  "catalog.sync.sleeves",
  "catalog.sync.deckboxes",
  "catalog.sync.binders",
  "catalog.sync.pages",
  "catalog.sync.dice",
  "catalog.sync.counters",
  "catalog.sync.playmats",
];

function jobsToRun(): ProductCatalogJobKey[] {
  if (process.argv.includes("--sealed-only")) return [...SEALED_JOBS];
  if (process.argv.includes("--accessories-only")) return [...MANUFACTURER_JOBS];
  return [...SEALED_JOBS, ...MANUFACTURER_JOBS];
}

async function seedStoreListings(
  pool: Pool,
  storeId: string,
  limit = 5,
): Promise<{ seeded: number; variantIds: string[] }> {
  const variants = await pool.query<{
    id: string;
    title: string;
    category: string;
  }>(
    `
    SELECT v.id,
           COALESCE(p.title_pt, p.title, 'Produto') AS title,
           p.category
    FROM product_catalog.variants v
    JOIN product_catalog.products p ON p.id = v.product_id
    ORDER BY CASE WHEN p.category = 'SEALED_PRODUCT' THEN 0 ELSE 1 END, p.updated_at DESC NULLS LAST
    LIMIT $1
    `,
    [limit],
  );
  const categoryMap: Record<string, string> = {
    SEALED_PRODUCT: "booster",
    SLEEVES: "sleeve",
    DECK_BOX: "deck_box",
    BINDER: "accessory",
    BINDER_PAGE: "accessory",
    DICE: "accessory",
    COUNTERS: "accessory",
    PLAYMAT: "playmat",
  };
  const variantIds: string[] = [];
  let seeded = 0;
  for (const row of variants.rows) {
    const res = await pool.query(
      `
      INSERT INTO product_catalog.seller_products (store_id, variant_id, stock, price_cents, condition)
      VALUES ($1::uuid, $2::uuid, 10, 9990, 'NEW')
      ON CONFLICT (store_id, variant_id, condition) DO UPDATE SET
        stock = EXCLUDED.stock,
        price_cents = EXCLUDED.price_cents,
        updated_at = now(),
        is_active = true
      RETURNING variant_id
      `,
      [storeId, row.id],
    );
    if (res.rowCount && res.rowCount > 0) {
      seeded++;
      variantIds.push(row.id);
    }
    await pool
      .query(
        `
      INSERT INTO tcg_judge.store_products (
        store_id, name, category, price_cents, stock, is_active, master_variant_id, language, images
      )
      VALUES (
        $1::uuid, $2, $3, 9990, 10, true, $4::uuid, 'pt', ARRAY[]::text[]
      )
      `,
        [storeId, row.title, categoryMap[row.category] ?? "accessory", row.id],
      )
      .catch((err) => {
        console.log(JSON.stringify({ step: "seed_store_products_skip", err: String(err) }));
      });
  }
  return { seeded, variantIds };
}

async function main() {
  loadEnvFile();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL required");
  const pool = new Pool({ connectionString: pgUrl(databaseUrl) });
  const requestId = getIdGenerator().generate();
  const jobKeys = jobsToRun();

  try {
    const scheduler = createProviderScheduler(pool);
    await scheduler.syncFromMemoryRegistry();
    const regCount = await pool.query(`SELECT count(*)::int AS n FROM product_catalog.provider_registry`);
    console.log(JSON.stringify({ step: "bootstrap", providers: regCount.rows[0].n }));

    const repo = new PostgresProductCatalogRepository(pool);
    const sync = new ProductCatalogSyncService(repo, pool);
    const syncResults: Array<{ job: string; upserted: number; ok: boolean; errors: string[] }> = [];

    for (const jobKey of jobKeys) {
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

    const byCategory = await pool.query<{ category: string; n: number }>(
      `SELECT category, count(*)::int AS n FROM product_catalog.products GROUP BY category ORDER BY n DESC`,
    );
    const products = await pool.query(`SELECT count(*)::int AS n FROM product_catalog.products`);
    const variants = await pool.query(`SELECT count(*)::int AS n FROM product_catalog.variants`);

    const linker = createMasterListingLinkService(pool);
    const link = await linker.linkUnmatchedListings({ limit: 5000 });

    let seed: { seeded: number; variantIds: string[] } | undefined;
    const seedStoreId = process.env.SEED_STORE_ID;
    if (seedStoreId) {
      seed = await seedStoreListings(pool, seedStoreId, 5);
      console.log(JSON.stringify({ step: "seed_listings", storeId: seedStoreId, ...seed }));
    }

    console.log(
      JSON.stringify({
        step: "done",
        products: products.rows[0].n,
        variants: variants.rows[0].n,
        byCategory: byCategory.rows,
        linked: link.linked,
        skipped: link.skipped,
        seed,
        syncResults,
        phase3Hint:
          "Publicar no catálogo mestre ou set SEED_STORE_ID=<store_uuid> para seed de seller_products",
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
