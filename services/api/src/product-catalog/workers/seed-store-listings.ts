/**
 * Phase 3 seed: publish first N master variants to a store.
 * Usage: SEED_STORE_ID=<uuid> npx tsx src/product-catalog/workers/seed-store-listings.ts [limit]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";

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

async function main() {
  loadEnvFile();
  const storeId = process.env.SEED_STORE_ID;
  if (!storeId) throw new Error("SEED_STORE_ID required");
  const limit = Number(process.argv[2] ?? "5");
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL required");
  const pool = new Pool({
    connectionString: databaseUrl.replace(/^postgresql\+asyncpg:/, "postgresql:"),
  });

  try {
    const variants = await pool.query<{ id: string; title: string; category: string }>(
      `
      SELECT v.id,
             COALESCE(p.title_pt, p.title, 'Produto') AS title,
             p.category
      FROM product_catalog.variants v
      JOIN product_catalog.products p ON p.id = v.product_id
      ORDER BY CASE WHEN p.category = 'SEALED_PRODUCT' THEN 0 ELSE 1 END,
               p.updated_at DESC NULLS LAST
      LIMIT $1
      `,
      [limit],
    );

    let seeded = 0;
    for (const row of variants.rows) {
      await pool.query(
        `
        INSERT INTO product_catalog.seller_products (store_id, variant_id, stock, price_cents, condition)
        VALUES ($1::uuid, $2::uuid, 10, 9990, 'NEW')
        ON CONFLICT (store_id, variant_id, condition) DO UPDATE SET
          stock = EXCLUDED.stock,
          price_cents = EXCLUDED.price_cents,
          updated_at = now(),
          is_active = true
        `,
        [storeId, row.id],
      );
      seeded++;
      try {
        await pool.query(
          `
          INSERT INTO tcg_judge.store_products (
            store_id, name, category, price_cents, stock, is_active, master_variant_id, language, images
          )
          VALUES ($1::uuid, $2, $3, 9990, 10, true, $4::uuid, 'pt', ARRAY[]::text[])
          `,
          [storeId, row.title, categoryMap[row.category] ?? "accessory", row.id],
        );
      } catch (err) {
        console.log(JSON.stringify({ step: "store_products_skip", err: String(err).slice(0, 200) }));
      }
    }

    const counts = await pool.query(
      `
      SELECT
        (SELECT count(*)::int FROM product_catalog.products WHERE category = 'SEALED_PRODUCT') AS sealed,
        (SELECT count(*)::int FROM product_catalog.seller_products) AS seller_products,
        (SELECT count(*)::int FROM tcg_judge.store_products WHERE master_variant_id IS NOT NULL) AS linked_store
      `,
    );

    console.log(
      JSON.stringify({
        step: "done",
        storeId,
        seeded,
        titles: variants.rows.map((r) => r.title),
        counts: counts.rows[0],
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
