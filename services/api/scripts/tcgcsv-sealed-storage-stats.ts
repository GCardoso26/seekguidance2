/**
 * Storage/throughput evidence for TCGCSV sealed cap sizing.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createCatalogPgPool } from "../src/product-catalog/persistence/createCatalogPgPool.js";

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
const pool = createCatalogPgPool({ max: 1 });
try {
  const { rows: assets } = await pool.query(`
    WITH tcgcsv_assets AS (
      SELECT DISTINCT a.id, a.size_bytes
      FROM media.asset_links l
      JOIN media.assets a ON a.id = l.asset_id
      JOIN product_catalog.provider_mappings pm ON pm.variant_id = l.entity_id::uuid
      WHERE l.entity_type = 'product_variant'
        AND pm.provider_id = 'tcgcsv-sealed'
    )
    SELECT COUNT(*)::int AS assets,
           COALESCE(AVG(size_bytes), 0)::bigint AS avg_bytes,
           COALESCE(SUM(size_bytes), 0)::bigint AS total_bytes,
           COALESCE(MAX(size_bytes), 0)::bigint AS max_bytes
    FROM tcgcsv_assets
  `);
  const { rows: dbsize } = await pool.query(`
    SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size
  `);
  const { rows: tables } = await pool.query(`
    SELECT t.relname AS table,
           n.nspname AS schema,
           pg_total_relation_size(t.oid) AS total_bytes,
           (SELECT reltuples::bigint FROM pg_class c WHERE c.oid = t.oid) AS approx_rows,
           CASE WHEN (SELECT reltuples FROM pg_class c WHERE c.oid = t.oid) > 0
                THEN (pg_total_relation_size(t.oid) /
                      (SELECT reltuples FROM pg_class c WHERE c.oid = t.oid))::bigint
                ELSE NULL END AS bytes_per_row
    FROM pg_class t
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE t.relkind = 'r'
      AND (
        (n.nspname = 'product_catalog' AND t.relname IN
          ('products','product_variants','variants','provider_mappings','collections','product_games'))
        OR (n.nspname = 'media' AND t.relname IN ('assets','asset_links','asset_versions'))
      )
    ORDER BY pg_total_relation_size(t.oid) DESC
  `);
  console.log(JSON.stringify({ assets: assets[0], db: dbsize[0], tables }, null, 2));
} finally {
  await pool.end();
}
