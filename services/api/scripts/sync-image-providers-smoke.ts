/**
 * Focused sync for image-provider validation: tcgcsv-sealed + Shopify sleeves.
 * Usage: npx tsx scripts/sync-image-providers-smoke.ts
 */
import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { ProductCatalogSyncService } from "../src/product-catalog/application/ProductCatalogSyncService.js";
import { PostgresProductCatalogRepository } from "../src/product-catalog/persistence/PostgresProductCatalogRepository.js";
import { TcgCsvSealedProvider } from "../src/product-catalog/providers/sealed/TcgCsvSealedProvider.js";
import { DragonShieldSleevesProvider } from "../src/product-catalog/manufacturers/dragon-shield/provider.js";
import { UltraProSleevesProvider } from "../src/product-catalog/manufacturers/ultra-pro/provider.js";
import { HeavyPlayPlaymatProvider } from "../src/product-catalog/manufacturers/heavy-play/provider.js";

function pgUrl(raw: string): string {
  return raw.replace(/^postgresql\+asyncpg:/, "postgresql:");
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL required");

  process.env.TCGCSV_SEALED_MAX_GROUPS ??= "4";
  process.env.TCGCSV_SEALED_MAX_PRODUCTS ??= "40";
  process.env.SHOPIFY_ACCESSORY_MAX_PAGES ??= "1";
  process.env.ASSET_PIPELINE_PLACEHOLDER_MODE ??= "skip";

  const pool = new Pool({ connectionString: pgUrl(databaseUrl), max: 3 });
  const repo = new PostgresProductCatalogRepository(pool);
  const service = new ProductCatalogSyncService(repo, pool);
  const requestId = randomUUID();

  const sealed = await service.runJob(
    "catalog.sync.sealed",
    [new TcgCsvSealedProvider()],
    { requestId, mode: "full" },
  );
  console.log(JSON.stringify({ job: "sealed-tcgcsv", ...sealed }));

  const sleeves = await service.runJob(
    "catalog.sync.sleeves",
    [new DragonShieldSleevesProvider(), new UltraProSleevesProvider()],
    { requestId, mode: "full" },
  );
  console.log(JSON.stringify({ job: "sleeves-shopify", ...sleeves }));

  const playmats = await service.runJob(
    "catalog.sync.playmats",
    [new HeavyPlayPlaymatProvider()],
    { requestId, mode: "full" },
  );
  console.log(JSON.stringify({ job: "playmats-heavy-play", ...playmats }));

  const stats = await pool.query<{
    total: string;
    tcgplayer: string;
    shopify: string;
    last_2h: string;
  }>(`
    SELECT
      COUNT(*)::text AS total,
      COUNT(*) FILTER (
        WHERE cdn_url ILIKE '%tcgplayer%'
           OR derivatives->'_meta'->>'source' ILIKE '%tcgplayer%'
           OR derivatives::text ILIKE '%tcgplayer-cdn%'
      )::text AS tcgplayer,
      COUNT(*) FILTER (
        WHERE cdn_url ILIKE '%cdn.shopify.com%'
           OR derivatives->'_meta'->>'source' ILIKE '%shopify%'
           OR derivatives::text ILIKE '%cdn.shopify.com%'
      )::text AS shopify,
      COUNT(*) FILTER (WHERE created_at > now() - interval '2 hours')::text AS last_2h
    FROM media.assets
  `);
  console.log(JSON.stringify({ media_assets: stats.rows[0] }));

  const samples = await pool.query(`
    SELECT a.id,
           a.cdn_url,
           a.created_at,
           a.derivatives->'_meta'->>'provider' AS provider,
           l.entity_type,
           l.role
    FROM media.assets a
    LEFT JOIN media.asset_links l ON l.asset_id = a.id
    WHERE a.created_at > now() - interval '2 hours'
      AND (
        a.cdn_url ILIKE '%tcgplayer%'
        OR a.cdn_url ILIKE '%cdn.shopify.com%'
        OR a.derivatives::text ILIKE '%tcgplayer-cdn%'
        OR a.derivatives::text ILIKE '%cdn.shopify.com%'
      )
    ORDER BY a.created_at DESC
    LIMIT 12
  `);
  console.log(JSON.stringify({ samples: samples.rows }, null, 2));

  await pool.end();
  process.exit(sealed.ok && sleeves.ok && playmats.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
