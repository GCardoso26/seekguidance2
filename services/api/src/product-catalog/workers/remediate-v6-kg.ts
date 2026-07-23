/**
 * V6 remediation — link master listings + ensure Gamegenic collection (no new BC).
 * Env: DATABASE_URL
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";
import { createMasterListingLinkService } from "../application/MasterListingLinkService.js";
import { createProductCollectionsService } from "../application/ProductCollectionsService.js";

function loadEnv() {
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

async function main() {
  loadEnv();
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL required");
  const pool = new Pool({
    connectionString: raw.replace(/^postgresql\+asyncpg:/, "postgresql:"),
    ssl: { rejectUnauthorized: false },
  });
  try {
    const link = createMasterListingLinkService(pool);
    const linkResult = await link.linkUnmatchedListings({ limit: 10000 });

    const collections = createProductCollectionsService(pool);
    const collectionId = await collections.upsert({
      name: "Gamegenic Official Line",
      code: "GAMEGENIC-OFFICIAL",
      slug: "gamegenic-official-line",
      description: "Official Gamegenic accessories — Product Knowledge Graph V6 remediation",
      official: true,
    });

    const attach = await pool.query(
      `
      UPDATE product_catalog.products p
      SET collection_id = $1::uuid, updated_at = now()
      FROM product_catalog.manufacturers m
      WHERE p.manufacturer_id = m.id
        AND lower(m.name) LIKE '%gamegenic%'
        AND (p.collection_id IS NULL OR p.collection_id <> $1::uuid)
      RETURNING p.id
      `,
      [collectionId],
    );

    const snap = await pool.query(`
      SELECT
        (SELECT count(*)::int FROM product_catalog.collections) AS collections,
        (SELECT count(*)::int FROM product_catalog.products WHERE collection_id IS NOT NULL) AS products_in_collections,
        (SELECT count(*)::int FROM tcg_judge.store_products WHERE master_variant_id IS NOT NULL) AS master_links,
        (SELECT count(*)::int FROM product_catalog.official_product_contents) AS contents,
        (SELECT count(*)::int FROM product_catalog.product_specifications) AS specs
    `);

    console.log(
      JSON.stringify({
        linkResult,
        collectionId,
        attachedProducts: attach.rowCount ?? 0,
        ...snap.rows[0],
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
