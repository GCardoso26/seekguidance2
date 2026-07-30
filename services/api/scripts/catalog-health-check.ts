/**
 * Sanidade pós-purge: contagens que o critério de pronto exige.
 * npx tsx scripts/catalog-health-check.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createCatalogPgPool } from "../src/product-catalog/persistence/createCatalogPgPool.js";

function loadEnvFile() {
  const p = resolve(process.cwd(), ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m || process.env[m[1]]) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}

loadEnvFile();
const pool = createCatalogPgPool({ max: 1 });

const QUERIES: Array<[string, string]> = [
  [
    "sealed_tcgcsv_products",
    `SELECT count(*)::int AS n FROM product_catalog.products p
     WHERE p.category = 'SEALED_PRODUCT'
       AND EXISTS (SELECT 1 FROM product_catalog.provider_mappings pm
                   WHERE pm.product_id = p.id AND pm.provider_id = 'tcgcsv-sealed')`,
  ],
  [
    "products_without_variant",
    `SELECT count(*)::int AS n FROM product_catalog.products p
     WHERE NOT EXISTS (SELECT 1 FROM product_catalog.variants v WHERE v.product_id = p.id)`,
  ],
  [
    "duplicate_fingerprints",
    `SELECT count(*)::int AS n FROM (
       SELECT fingerprint FROM product_catalog.variants
       WHERE fingerprint IS NOT NULL AND fingerprint <> ''
       GROUP BY 1 HAVING count(*) > 1
     ) t`,
  ],
  [
    "variants_without_fingerprint",
    `SELECT count(*)::int AS n FROM product_catalog.variants
     WHERE fingerprint IS NULL OR fingerprint = ''`,
  ],
  ["media_assets", `SELECT count(*)::int AS n FROM media.assets`],
  [
    "assets_without_dimensions",
    `SELECT count(*)::int AS n FROM media.assets WHERE width IS NULL OR height IS NULL`,
  ],
  [
    "assets_hotlinking_tcgplayer",
    `SELECT count(*)::int AS n FROM media.assets WHERE cdn_url LIKE '%tcgplayer%'`,
  ],
];

try {
  const out: Record<string, number> = {};
  for (const [label, sql] of QUERIES) {
    out[label] = (await pool.query<{ n: number }>(sql)).rows[0]?.n ?? 0;
  }
  console.log(JSON.stringify(out, null, 2));
} finally {
  await pool.end();
}
