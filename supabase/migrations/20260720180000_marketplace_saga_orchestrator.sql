-- Marketplace as orchestrator + Saga/Process Manager foundation
-- seller_products remains legacy bridge; new path uses marketplace.listings + sagas
BEGIN;

-- ---------------------------------------------------------------------------
-- Extend listings for product master catalog (VariantID) without denormalizing Catalog
-- ---------------------------------------------------------------------------
ALTER TABLE marketplace.listings
  ADD COLUMN IF NOT EXISTS subject_type text NOT NULL DEFAULT 'catalog_variant'
    CHECK (subject_type IN ('catalog_variant', 'product_variant')),
  ADD COLUMN IF NOT EXISTS product_variant_id uuid,
  ADD COLUMN IF NOT EXISTS inventory_stock_unit_id uuid,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- catalog_card_id / catalog_variant_id stay for card singles; product path uses product_variant_id
ALTER TABLE marketplace.listings
  ALTER COLUMN catalog_card_id DROP NOT NULL;

ALTER TABLE marketplace.listings
  ALTER COLUMN catalog_variant_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_product_variant
  ON marketplace.listings (product_variant_id)
  WHERE product_variant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_subject
  ON marketplace.listings (subject_type, status);

-- Status timeline (append-only)
CREATE TABLE IF NOT EXISTS marketplace.listing_status (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   uuid NOT NULL REFERENCES marketplace.listings(id) ON DELETE CASCADE,
  from_status  text,
  to_status    text NOT NULL,
  reason       text,
  actor_id     text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listing_status_listing
  ON marketplace.listing_status (listing_id, created_at DESC);

-- Media links (references Asset Service — never owns bytes)
CREATE TABLE IF NOT EXISTS marketplace.listing_media (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   uuid NOT NULL REFERENCES marketplace.listings(id) ON DELETE CASCADE,
  asset_id     uuid,
  role         text NOT NULL DEFAULT 'primary',
  sort_order   int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listing_media_listing
  ON marketplace.listing_media (listing_id, sort_order);

-- Listing / seller metrics (projections — written by Analytics consumers later)
CREATE TABLE IF NOT EXISTS marketplace.listing_metrics (
  listing_id       uuid PRIMARY KEY REFERENCES marketplace.listings(id) ON DELETE CASCADE,
  views            bigint NOT NULL DEFAULT 0,
  clicks           bigint NOT NULL DEFAULT 0,
  favorites        bigint NOT NULL DEFAULT 0,
  add_to_cart      bigint NOT NULL DEFAULT 0,
  sales            bigint NOT NULL DEFAULT 0,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketplace.seller_metrics (
  seller_id        uuid PRIMARY KEY REFERENCES marketplace.sellers(id) ON DELETE CASCADE,
  active_listings  int NOT NULL DEFAULT 0,
  total_sales      bigint NOT NULL DEFAULT 0,
  gmv_cents        bigint NOT NULL DEFAULT 0,
  avg_rating       numeric(4, 2),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Saga / Process Manager (Workflow Orchestrator)
-- ---------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_sagas_type_status
  ON platform.sagas (saga_type, status);

CREATE INDEX IF NOT EXISTS idx_sagas_correlation
  ON platform.sagas (correlation_id);

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

CREATE INDEX IF NOT EXISTS idx_saga_steps_saga
  ON platform.saga_steps (saga_id, step_order);

COMMIT;
