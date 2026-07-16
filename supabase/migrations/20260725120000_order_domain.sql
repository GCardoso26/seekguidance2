-- Sprint 5.2 — Order Domain persistence (financial bounded context)
-- Schemas: cart.* · order.* · reservation.*
-- NO cross-context FKs to marketplace.* / catalog.* / identity.* (ADR-007 / ORDER_DOMAIN.md)
-- Outbox remains platform.outbox_events (shared).

BEGIN;

CREATE SCHEMA IF NOT EXISTS cart;
CREATE SCHEMA IF NOT EXISTS "order";
CREATE SCHEMA IF NOT EXISTS reservation;

-- ===========================================================================
-- cart
-- ===========================================================================
CREATE TABLE IF NOT EXISTS cart.carts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id      uuid NOT NULL,
  status        text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'checked_out', 'abandoned')),
  row_version   bigint NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carts_buyer_open
  ON cart.carts (buyer_id)
  WHERE status = 'open';

-- listing_id / catalog_variant_id are references only — no FK (bounded-context independence).
CREATE TABLE IF NOT EXISTS cart.cart_items (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id               uuid NOT NULL REFERENCES cart.carts(id) ON DELETE CASCADE,
  listing_id            uuid NOT NULL,
  catalog_variant_id    uuid NOT NULL,
  quantity              int NOT NULL CHECK (quantity > 0),
  price_snapshot_cents  bigint NOT NULL CHECK (price_snapshot_cents >= 0),
  currency              text NOT NULL DEFAULT 'BRL' CHECK (currency IN ('BRL')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cart_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart.cart_items (cart_id);

COMMENT ON COLUMN cart.cart_items.price_snapshot_cents IS
  'Frozen at add/checkout — never re-read from marketplace.listings (ORDER_DOMAIN.md).';
COMMENT ON COLUMN cart.cart_items.listing_id IS
  'Marketplace reference by ID only — no FK across bounded contexts.';

-- ===========================================================================
-- order (quoted schema — ORDER is a SQL keyword)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "order".checkout_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id       uuid NOT NULL,
  buyer_id      uuid NOT NULL,
  status        text NOT NULL DEFAULT 'CREATED'
    CHECK (status IN (
      'CREATED', 'VALIDATING', 'RESERVED', 'PAYMENT_PENDING', 'COMPLETED', 'FAILED'
    )),
  order_id      uuid,
  row_version   bigint NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_buyer
  ON "order".checkout_sessions (buyer_id);

CREATE TABLE IF NOT EXISTS "order".orders (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id              uuid NOT NULL,
  checkout_session_id   uuid NOT NULL,
  status                text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'PAID', 'CANCELLED', 'FULFILLED')),
  total_amount_cents    bigint NOT NULL CHECK (total_amount_cents >= 0),
  currency              text NOT NULL DEFAULT 'BRL' CHECK (currency IN ('BRL')),
  row_version           bigint NOT NULL DEFAULT 1,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON "order".orders (buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_checkout ON "order".orders (checkout_session_id);

CREATE TABLE IF NOT EXISTS "order".order_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            uuid NOT NULL REFERENCES "order".orders(id) ON DELETE CASCADE,
  listing_id          uuid NOT NULL,
  catalog_variant_id  uuid NOT NULL,
  quantity            int NOT NULL CHECK (quantity > 0),
  unit_price_cents    bigint NOT NULL CHECK (unit_price_cents >= 0),
  currency            text NOT NULL DEFAULT 'BRL' CHECK (currency IN ('BRL'))
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON "order".order_items (order_id);

COMMENT ON COLUMN "order".order_items.unit_price_cents IS
  'Snapshot from cart — Order.total never recalculated from live Listing.';

-- ===========================================================================
-- reservation
-- ===========================================================================
CREATE TABLE IF NOT EXISTS reservation.inventory_reservations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id          uuid NOT NULL,
  inventory_item_id   uuid NOT NULL,
  buyer_id            uuid NOT NULL,
  quantity            int NOT NULL CHECK (quantity > 0),
  status              text NOT NULL DEFAULT 'HELD'
    CHECK (status IN ('HELD', 'CONFIRMED', 'RELEASED', 'EXPIRED')),
  expires_at          timestamptz NOT NULL,
  row_version         bigint NOT NULL DEFAULT 1,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_inventory_held
  ON reservation.inventory_reservations (inventory_item_id)
  WHERE status = 'HELD';

CREATE INDEX IF NOT EXISTS idx_reservations_expires
  ON reservation.inventory_reservations (expires_at)
  WHERE status = 'HELD';

COMMENT ON COLUMN reservation.inventory_reservations.inventory_item_id IS
  'Marketplace inventory reference by ID only — no FK (ORDER_DOMAIN.md).';

COMMIT;
