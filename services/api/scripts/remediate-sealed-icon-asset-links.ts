/**
 * ADR-016 — Unlink set-icon assets wrongly used as sealed packshots.
 *
 * MTG: Scryfall set SVG icons
 * Pokémon: pokemontcg.io logo / symbol
 *
 * Does NOT delete media.assets rows (may be shared); only removes product_variant links.
 *
 * Usage (from services/api):
 *   node --env-file=.env --import tsx scripts/remediate-sealed-icon-asset-links.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";

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

loadEnvFile(resolve(process.cwd(), ".env"));
loadEnvFile(resolve(process.cwd(), "../../.env"));

const SQL = `
WITH doomed AS (
  SELECT l.id
  FROM media.asset_links l
  JOIN product_catalog.variants v ON v.id = l.entity_id
  JOIN product_catalog.products p ON p.id = v.product_id
  JOIN media.assets a ON a.id = l.asset_id
  WHERE l.entity_type = 'product_variant'
    AND (
      p.category::text ILIKE '%sealed%'
      OR p.product_type::text ILIKE '%sealed%'
      OR p.sku ILIKE '%-BOX-%'
      OR p.sku ILIKE '%-TROVE-%'
      OR p.sku ILIKE '%-PACK-%'
    )
    AND (
      (
        p.game = 'MTG'
        AND (
          a.cdn_url ILIKE '%scryfall%'
          OR a.cdn_url ILIKE '%.svg%'
          OR a.cdn_url ILIKE '%svgs.scryfall%'
        )
      )
      OR (
        p.game = 'POKEMON'
        AND (
          a.cdn_url ILIKE '%images.pokemontcg.io%'
          OR a.cdn_url ILIKE '%/logo%'
          OR a.cdn_url ILIKE '%symbol%'
        )
      )
    )
)
DELETE FROM media.asset_links l
USING doomed d
WHERE l.id = d.id
RETURNING l.id;
`;

const CLEAN_STORE_IMAGES_SQL = `
UPDATE tcg_judge.store_products p
SET images = COALESCE((
  SELECT array_agg(u ORDER BY ord)
  FROM unnest(COALESCE(p.images, ARRAY[]::text[])) WITH ORDINALITY AS t(u, ord)
  WHERE u IS NOT NULL
    AND u <> ''
    AND u NOT ILIKE '%/logo%'
    AND u NOT ILIKE '%/symbol%'
    AND u NOT ILIKE '%svgs.scryfall%'
    AND u NOT ILIKE '%.svg'
), ARRAY[]::text[])
WHERE p.category::text ILIKE '%sealed%'
   OR COALESCE(p.sku, '') ILIKE 'PKM-%'
   OR COALESCE(p.tcg_id, '') ILIKE 'POKEMON'
RETURNING p.id;
`;

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL?.replace(/^postgresql\+asyncpg:/, "postgresql:");
  if (!databaseUrl) throw new Error("DATABASE_URL required");
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const res = await pool.query<{ id: string }>(SQL);
    const cleaned = await pool.query<{ id: string }>(CLEAN_STORE_IMAGES_SQL);
    console.log(
      JSON.stringify(
        {
          ok: true,
          unlinked: res.rowCount ?? res.rows.length,
          store_products_images_cleaned: cleaned.rowCount ?? cleaned.rows.length,
        },
        null,
        2,
      ),
    );
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
