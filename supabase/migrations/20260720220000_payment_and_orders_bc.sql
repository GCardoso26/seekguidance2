-- Payment (confirmed) distinct from PaymentIntent + Orders BC foundation
BEGIN;

-- ---------------------------------------------------------------------------
-- Checkout: Payment = gateway confirmed (Intent = want to pay)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checkout.payments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id           uuid NOT NULL REFERENCES checkout.sessions(id) ON DELETE CASCADE,
  payment_intent_id    uuid REFERENCES checkout.payment_intents(id),
  external_intent_id   text NOT NULL,
  provider             text NOT NULL DEFAULT 'stub',
  amount_cents         int NOT NULL CHECK (amount_cents >= 0),
  currency             text NOT NULL DEFAULT 'BRL',
  method               text NOT NULL DEFAULT 'unknown'
    CHECK (method IN ('unknown', 'card', 'pix', 'boleto', 'wallet', 'other')),
  status               text NOT NULL DEFAULT 'captured'
    CHECK (status IN ('authorized', 'captured', 'failed', 'refunded', 'chargeback')),
  captured_at          timestamptz NOT NULL DEFAULT now(),
  provider_payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (external_intent_id)
);

CREATE INDEX IF NOT EXISTS idx_checkout_payments_session
  ON checkout.payments (session_id);

ALTER TABLE checkout.sessions
  ADD COLUMN IF NOT EXISTS payment_id uuid;

-- ---------------------------------------------------------------------------
-- Orders BC
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS orders;

CREATE TABLE IF NOT EXISTS orders.orders (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id             text NOT NULL,
  seller_id            uuid,
  status               text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN (
      'PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'
    )),
  payment_status       text NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN (
      'unpaid', 'pending', 'paid', 'failed', 'refund_requested', 'refunded'
    )),
  checkout_session_id  uuid,
  checkout_payment_id  uuid,
  currency             text NOT NULL DEFAULT 'BRL',
  subtotal_cents       int NOT NULL DEFAULT 0,
  discount_cents       int NOT NULL DEFAULT 0,
  total_cents          int NOT NULL DEFAULT 0,
  shipment_ref         text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_checkout_session
  ON orders.orders (checkout_session_id)
  WHERE checkout_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders.orders (buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders.orders (seller_id, created_at DESC)
  WHERE seller_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS orders.order_items (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             uuid NOT NULL REFERENCES orders.orders(id) ON DELETE CASCADE,
  listing_id           uuid,
  product_variant_id   uuid,
  catalog_variant_id   uuid,
  quantity             int NOT NULL CHECK (quantity > 0),
  unit_price_cents     int NOT NULL CHECK (unit_price_cents >= 0),
  total_cents          int NOT NULL CHECK (total_cents >= 0),
  currency             text NOT NULL DEFAULT 'BRL'
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON orders.order_items (order_id);

-- Append-only timeline — never UPDATE
CREATE TABLE IF NOT EXISTS orders.order_timeline (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES orders.orders(id) ON DELETE CASCADE,
  event_type   text NOT NULL,
  payload      jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_timeline_order
  ON orders.order_timeline (order_id, occurred_at ASC);

-- ---------------------------------------------------------------------------
-- Orders read models (projections) — listings never query aggregate
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders.proj_seller_orders (
  seller_id      uuid NOT NULL,
  order_id       uuid NOT NULL,
  buyer_id       text NOT NULL,
  status         text NOT NULL,
  total_cents    int NOT NULL,
  currency       text NOT NULL DEFAULT 'BRL',
  created_at     timestamptz NOT NULL,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (seller_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_proj_seller_orders_list
  ON orders.proj_seller_orders (seller_id, created_at DESC);

CREATE TABLE IF NOT EXISTS orders.proj_buyer_orders (
  buyer_id       text NOT NULL,
  order_id       uuid NOT NULL,
  seller_id      uuid,
  status         text NOT NULL,
  total_cents    int NOT NULL,
  currency       text NOT NULL DEFAULT 'BRL',
  created_at     timestamptz NOT NULL,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (buyer_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_proj_buyer_orders_list
  ON orders.proj_buyer_orders (buyer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS orders.proj_dashboard (
  id               text PRIMARY KEY DEFAULT 'global',
  orders_total     bigint NOT NULL DEFAULT 0,
  orders_paid      bigint NOT NULL DEFAULT 0,
  gmv_cents        bigint NOT NULL DEFAULT 0,
  refunded_cents   bigint NOT NULL DEFAULT 0,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

INSERT INTO orders.proj_dashboard (id) VALUES ('global') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS orders.proj_recent_orders (
  order_id       uuid PRIMARY KEY,
  buyer_id       text NOT NULL,
  seller_id      uuid,
  status         text NOT NULL,
  total_cents    int NOT NULL,
  currency       text NOT NULL DEFAULT 'BRL',
  created_at     timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_proj_recent_orders
  ON orders.proj_recent_orders (created_at DESC);

COMMIT;
