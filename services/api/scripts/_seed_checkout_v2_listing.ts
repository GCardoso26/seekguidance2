/**
 * Apply Checkout V2 deps (marketplace + inventory + sagas) and seed 1 sellable listing.
 * Idempotent. Uses services/api/.env DATABASE_URL.
 *
 *   npx tsx scripts/_seed_checkout_v2_listing.ts
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env: Record<string, string> = {};
for (const line of fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i < 1) continue;
  env[t.slice(0, i)] = t.slice(i + 1).replace(/^["']|["']$/g, "");
}
const url = (env.DATABASE_URL || "").replace(/^postgresql\+asyncpg:/i, "postgresql:");
if (!url) throw new Error("DATABASE_URL missing");

const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

const DDL = `
CREATE SCHEMA IF NOT EXISTS marketplace;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS identity;

CREATE TABLE IF NOT EXISTS marketplace.sellers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name  text NOT NULL,
  slug          text NOT NULL UNIQUE,
  status        text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'suspended')),
  verification  text NOT NULL DEFAULT 'unverified'
    CHECK (verification IN ('unverified', 'pending', 'verified')),
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_version   bigint NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketplace.inventory_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id           uuid NOT NULL REFERENCES marketplace.sellers(id) ON DELETE CASCADE,
  catalog_card_id     uuid NOT NULL,
  catalog_variant_id  uuid NOT NULL,
  quantity            int NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  row_version         bigint NOT NULL DEFAULT 1,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_id, catalog_variant_id)
);

CREATE TABLE IF NOT EXISTS marketplace.listings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id           uuid NOT NULL REFERENCES marketplace.sellers(id) ON DELETE CASCADE,
  catalog_card_id     uuid,
  catalog_variant_id  uuid,
  inventory_item_id   uuid REFERENCES marketplace.inventory_items(id) ON DELETE SET NULL,
  price_cents         bigint NOT NULL CHECK (price_cents >= 0),
  currency            text NOT NULL DEFAULT 'BRL' CHECK (currency IN ('BRL')),
  condition           text NOT NULL,
  language            text NOT NULL,
  notes               text,
  finish              text,
  quantity            int NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  status              text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused', 'sold_out')),
  row_version         bigint NOT NULL DEFAULT 1,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  subject_type text NOT NULL DEFAULT 'catalog_variant'
    CHECK (subject_type IN ('catalog_variant', 'product_variant')),
  product_variant_id uuid,
  inventory_stock_unit_id uuid,
  published_at timestamptz
);

CREATE TABLE IF NOT EXISTS inventory.stock_units (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        uuid NOT NULL,
  subject_type    text NOT NULL CHECK (subject_type IN ('product_variant', 'catalog_variant', 'store_product')),
  subject_id      uuid NOT NULL,
  condition       text NOT NULL DEFAULT 'NEW',
  on_hand         int NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
  reserved        int NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  available       int GENERATED ALWAYS AS (on_hand - reserved) STORED,
  seller_product_id uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, subject_type, subject_id, condition),
  CHECK (reserved <= on_hand)
);

CREATE TABLE IF NOT EXISTS inventory.reservations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_unit_id   uuid NOT NULL REFERENCES inventory.stock_units(id),
  quantity        int NOT NULL CHECK (quantity > 0),
  status          text NOT NULL CHECK (status IN ('held', 'confirmed', 'released', 'expired')),
  cart_id         text,
  order_id        text,
  expires_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory.stock_movements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_unit_id   uuid NOT NULL REFERENCES inventory.stock_units(id),
  kind            text NOT NULL CHECK (kind IN (
    'receive', 'adjust', 'reserve', 'release', 'confirm', 'expire', 'sale', 'return'
  )),
  delta_on_hand   int NOT NULL DEFAULT 0,
  delta_reserved  int NOT NULL DEFAULT 0,
  reason          text,
  reference_id    text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform.sagas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saga_type       text NOT NULL,
  correlation_id  text NOT NULL,
  status          text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'compensating', 'compensated', 'failed')),
  current_step    text,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
  context         jsonb NOT NULL DEFAULT '{}'::jsonb,
  error           text,
  started_at      timestamptz NOT NULL DEFAULT now(),
  finished_at     timestamptz,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform.saga_steps (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saga_id         uuid NOT NULL REFERENCES platform.sagas(id) ON DELETE CASCADE,
  step_name       text NOT NULL,
  step_order      int NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'compensated', 'skipped')),
  attempts        int NOT NULL DEFAULT 0,
  max_attempts    int NOT NULL DEFAULT 5,
  input           jsonb NOT NULL DEFAULT '{}'::jsonb,
  output          jsonb NOT NULL DEFAULT '{}'::jsonb,
  error           text,
  started_at      timestamptz,
  finished_at     timestamptz,
  UNIQUE (saga_id, step_name)
);

CREATE TABLE IF NOT EXISTS platform.domain_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      text NOT NULL,
  aggregate_type  text NOT NULL,
  aggregate_id    text NOT NULL,
  event_version   int NOT NULL DEFAULT 1,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  published_at    timestamptz
);
`;

const SEED_SLUG = "checkout-v2-e2e-seed";

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(DDL);

    // Ensure columns exist if listings table was partial
    await client.query(`
      ALTER TABLE marketplace.listings
        ADD COLUMN IF NOT EXISTS subject_type text NOT NULL DEFAULT 'catalog_variant',
        ADD COLUMN IF NOT EXISTS product_variant_id uuid,
        ADD COLUMN IF NOT EXISTS inventory_stock_unit_id uuid,
        ADD COLUMN IF NOT EXISTS published_at timestamptz
    `);

    let sellerId: string;
    const existingSeller = await client.query<{ id: string }>(
      `SELECT id FROM marketplace.sellers WHERE slug = $1`,
      [SEED_SLUG],
    );
    if (existingSeller.rows[0]) {
      sellerId = existingSeller.rows[0].id;
      await client.query(
        `UPDATE marketplace.sellers SET status='active', verification='verified', updated_at=now() WHERE id=$1`,
        [sellerId],
      );
    } else {
      sellerId = randomUUID();
      await client.query(
        `INSERT INTO marketplace.sellers (id, display_name, slug, status, verification)
         VALUES ($1,$2,$3,'active','verified')`,
        [sellerId, "Checkout V2 E2E Seed", SEED_SLUG],
      );
    }

    // Prefer a real catalog card id from legacy listings when available
    const legacy = await client.query<{
      card_id: string | null;
      price_cents: number;
      quantity: number;
    }>(
      `SELECT card_id::text AS card_id, price_cents::int, quantity::int
       FROM tcg_judge.card_listings
       WHERE status='active' AND quantity>0
       ORDER BY quantity DESC
       LIMIT 1`,
    );
    const catalogCardId = legacy.rows[0]?.card_id ?? randomUUID();
    const catalogVariantId = catalogCardId; // Checkout accepts catalog_variant subject
    const priceCents = Math.max(100, Number(legacy.rows[0]?.price_cents ?? 1500));
    const qty = Math.max(3, Number(legacy.rows[0]?.quantity ?? 5));

    // Upsert stock unit
    const stock = await client.query<{ id: string }>(
      `
      INSERT INTO inventory.stock_units (
        id, store_id, subject_type, subject_id, condition, on_hand, seller_product_id
      ) VALUES ($1,$2,'catalog_variant',$3,'NM',$4,NULL)
      ON CONFLICT (store_id, subject_type, subject_id, condition) DO UPDATE SET
        on_hand = GREATEST(inventory.stock_units.on_hand, EXCLUDED.on_hand),
        updated_at = now()
      RETURNING id
      `,
      [randomUUID(), sellerId, catalogVariantId, qty],
    );
    const stockUnitId = stock.rows[0]!.id;

    // One active listing for this seller (reuse if present)
    const existingListing = await client.query<{ id: string }>(
      `SELECT id FROM marketplace.listings
       WHERE seller_id=$1 AND status='active' AND quantity>0
       ORDER BY updated_at DESC LIMIT 1`,
      [sellerId],
    );

    let listingId: string;
    if (existingListing.rows[0]) {
      listingId = existingListing.rows[0].id;
      await client.query(
        `UPDATE marketplace.listings SET
           quantity=$2, price_cents=$3, inventory_stock_unit_id=$4,
           catalog_card_id=$5, catalog_variant_id=$6, status='active',
           subject_type='catalog_variant', published_at=COALESCE(published_at, now()),
           updated_at=now()
         WHERE id=$1`,
        [listingId, qty, priceCents, stockUnitId, catalogCardId, catalogVariantId],
      );
    } else {
      listingId = randomUUID();
      await client.query(
        `INSERT INTO marketplace.listings (
           id, seller_id, catalog_card_id, catalog_variant_id,
           price_cents, currency, condition, language, quantity, status,
           subject_type, inventory_stock_unit_id, published_at
         ) VALUES (
           $1,$2,$3,$4,$5,'BRL','NM','pt',$6,'active',
           'catalog_variant',$7,now()
         )`,
        [listingId, sellerId, catalogCardId, catalogVariantId, priceCents, qty, stockUnitId],
      );
    }

    const verify = await client.query(
      `SELECT id::text, status, quantity, price_cents, inventory_stock_unit_id::text AS stock
       FROM marketplace.listings WHERE id=$1`,
      [listingId],
    );
    const sellable = await client.query(
      `SELECT count(*)::int AS n FROM marketplace.listings WHERE status='active' AND quantity>0`,
    );

    await client.query("COMMIT");

    const out = {
      at: new Date().toISOString(),
      sellerId,
      listingId,
      stockUnitId,
      priceCents,
      quantity: qty,
      catalogCardId,
      sellableActive: sellable.rows[0]?.n ?? 0,
      listing: verify.rows[0],
    };
    console.log(JSON.stringify(out, null, 2));

    const reportsDir = path.resolve(root, "../../testing/reports");
    fs.mkdirSync(reportsDir, { recursive: true });
    fs.writeFileSync(
      path.join(reportsDir, "checkout-v2-seed-listing-latest.json"),
      JSON.stringify(out, null, 2),
    );
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
