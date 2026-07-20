-- Checkout BC V2 (ADR-015) — owns cart/session/coupon/payment intent
-- References Marketplace/Inventory/Pricing by ID only — no cross-schema FKs
BEGIN;

CREATE SCHEMA IF NOT EXISTS checkout;

CREATE TABLE IF NOT EXISTS checkout.carts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id      text NOT NULL,
  status        text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'checked_out', 'abandoned')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkout_carts_buyer_open
  ON checkout.carts (buyer_id) WHERE status = 'open';

CREATE TABLE IF NOT EXISTS checkout.cart_items (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id               uuid NOT NULL REFERENCES checkout.carts(id) ON DELETE CASCADE,
  listing_id            uuid NOT NULL,
  product_variant_id    uuid,
  catalog_variant_id    uuid,
  seller_id             uuid,
  stock_unit_id         uuid,
  quantity              int NOT NULL CHECK (quantity > 0),
  price_snapshot_cents  int NOT NULL CHECK (price_snapshot_cents >= 0),
  currency              text NOT NULL DEFAULT 'BRL',
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cart_id, listing_id)
);

CREATE TABLE IF NOT EXISTS checkout.coupons (
  code            text PRIMARY KEY,
  percent_off     int CHECK (percent_off IS NULL OR (percent_off > 0 AND percent_off <= 100)),
  amount_off_cents int CHECK (amount_off_cents IS NULL OR amount_off_cents > 0),
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

INSERT INTO checkout.coupons (code, percent_off, active) VALUES
  ('BEMVINDO10', 10, true),
  ('JUDGE5', 5, true)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS checkout.sessions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id            uuid NOT NULL REFERENCES checkout.carts(id),
  buyer_id           text NOT NULL,
  status             text NOT NULL DEFAULT 'created'
    CHECK (status IN (
      'created', 'validating', 'reserved', 'priced', 'payment_pending',
      'completed', 'failed', 'cancelled'
    )),
  coupon_code        text,
  subtotal_cents     int NOT NULL DEFAULT 0,
  discount_cents     int NOT NULL DEFAULT 0,
  total_cents        int NOT NULL DEFAULT 0,
  currency           text NOT NULL DEFAULT 'BRL',
  saga_id            uuid,
  payment_intent_id  text,
  reservation_ids    jsonb NOT NULL DEFAULT '[]'::jsonb,
  pricing_snapshot   jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key    text,
  error              text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_checkout_sessions_idem
  ON checkout.sessions (idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_buyer
  ON checkout.sessions (buyer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS checkout.payment_intents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid NOT NULL REFERENCES checkout.sessions(id) ON DELETE CASCADE,
  provider        text NOT NULL DEFAULT 'stub',
  external_id     text,
  amount_cents    int NOT NULL,
  currency        text NOT NULL DEFAULT 'BRL',
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'requires_action', 'succeeded', 'cancelled', 'failed')),
  client_secret   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMIT;
