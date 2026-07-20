-- Governance: idempotency, feature flags, projections offsets
BEGIN;

CREATE TABLE IF NOT EXISTS platform.idempotency_keys (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  command_name     text NOT NULL,
  idempotency_key  text NOT NULL,
  status           text NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
  request_hash     text,
  response_hash    text,
  response_body    jsonb,
  error            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (command_name, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_created
  ON platform.idempotency_keys (created_at);

CREATE TABLE IF NOT EXISTS platform.feature_flags (
  name               text PRIMARY KEY,
  enabled            boolean NOT NULL DEFAULT false,
  rollout_percentage int NOT NULL DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
  strategy           text NOT NULL DEFAULT 'OFF'
    CHECK (strategy IN ('ON', 'OFF', 'CANARY', 'PERCENTAGE', 'USER', 'SELLER', 'REGION')),
  conditions         jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

INSERT INTO platform.feature_flags (name, enabled, strategy, rollout_percentage) VALUES
  ('semantic_search', false, 'OFF', 0),
  ('checkout_v2', false, 'OFF', 0),
  ('notifications', false, 'OFF', 0),
  ('pricing_v2', true, 'ON', 100),
  ('marketplace_orchestrator', true, 'ON', 100),
  ('outbox_v2', true, 'ON', 100)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS platform.projection_checkpoints (
  consumer_name    text PRIMARY KEY,
  last_event_id    text,
  last_occurred_at timestamptz,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Materialized view stubs (refreshed by projection workers — not live SQL joins across BCs)
CREATE TABLE IF NOT EXISTS analytics.mv_lowest_prices (
  subject_type     text NOT NULL,
  subject_id       uuid NOT NULL,
  currency         text NOT NULL DEFAULT 'BRL',
  min_price_cents  int,
  listing_count    int NOT NULL DEFAULT 0,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (subject_type, subject_id, currency)
);

CREATE TABLE IF NOT EXISTS analytics.mv_popular_products (
  product_variant_id uuid PRIMARY KEY,
  views              bigint NOT NULL DEFAULT 0,
  sales              bigint NOT NULL DEFAULT 0,
  score              numeric(12, 4) NOT NULL DEFAULT 0,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics.mv_top_sellers (
  seller_id          uuid PRIMARY KEY,
  gmv_cents          bigint NOT NULL DEFAULT 0,
  sales_count        bigint NOT NULL DEFAULT 0,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics.mv_seller_dashboard (
  seller_id          uuid PRIMARY KEY,
  active_listings    int NOT NULL DEFAULT 0,
  reserved_units     int NOT NULL DEFAULT 0,
  gmv_cents          bigint NOT NULL DEFAULT 0,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

COMMIT;
