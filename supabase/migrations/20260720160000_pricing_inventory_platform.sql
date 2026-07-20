-- Domínios transversais: Pricing (produtos), Inventory, Events, Revisions,
-- Translations, Quality, Scheduler, Import Monitor, Embeddings
BEGIN;

CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS platform;

-- ---------------------------------------------------------------------------
-- Pricing — mercados + agregados (cartas E variantes de produto)
-- ---------------------------------------------------------------------------
INSERT INTO pricing.pricing_markets (code, name) VALUES
  ('TCGPLAYER', 'TCGPlayer'),
  ('CARDMARKET', 'Cardmarket'),
  ('CARDTRADER', 'CardTrader'),
  ('EBAY', 'eBay'),
  ('JUDGETCG', 'JudgeTCG Internal')
ON CONFLICT (code) DO NOTHING;

INSERT INTO pricing.currencies (code, name) VALUES
  ('BRL', 'Brazilian Real')
ON CONFLICT DO NOTHING;

-- Permitir BRL em snapshots (amplia check via nova tabela agregada)
CREATE TABLE IF NOT EXISTS pricing.price_quotes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type        text NOT NULL CHECK (subject_type IN ('catalog_card', 'catalog_variant', 'product_variant')),
  subject_id          uuid NOT NULL,
  market_id           uuid NOT NULL REFERENCES pricing.pricing_markets(id),
  currency            text NOT NULL DEFAULT 'BRL',
  min_price_cents     int,
  avg_price_cents     int,
  median_price_cents  int,
  max_price_cents     int,
  suggested_price_cents int,
  spread_bps          int,
  liquidity_score     numeric(8, 4),
  seller_count        int,
  sample_size         int,
  condition           text,
  finish              text,
  language            text,
  raw                 jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_quotes_subject
  ON pricing.price_quotes (subject_type, subject_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_quotes_market
  ON pricing.price_quotes (market_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS pricing.price_quote_history (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type        text NOT NULL,
  subject_id          uuid NOT NULL,
  market_id           uuid REFERENCES pricing.pricing_markets(id),
  currency            text NOT NULL DEFAULT 'BRL',
  price_cents         int NOT NULL,
  metric              text NOT NULL CHECK (metric IN ('min', 'avg', 'median', 'max', 'suggested', 'last_sale')),
  recorded_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_quote_history_subject
  ON pricing.price_quote_history (subject_type, subject_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS pricing.aggregated_valuations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type        text NOT NULL,
  subject_id          uuid NOT NULL,
  currency            text NOT NULL DEFAULT 'BRL',
  min_price_cents     int,
  avg_price_cents     int,
  median_price_cents  int,
  suggested_price_cents int,
  spread_bps          int,
  liquidity_score     numeric(8, 4),
  confidence          text CHECK (confidence IN ('high', 'medium', 'low')),
  sources             jsonb NOT NULL DEFAULT '[]'::jsonb,
  computed_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subject_type, subject_id, currency)
);

-- ---------------------------------------------------------------------------
-- Inventory (domínio isolado)
-- ---------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_inventory_stock_store
  ON inventory.stock_units (store_id);

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

CREATE INDEX IF NOT EXISTS idx_inventory_reservations_status
  ON inventory.reservations (status, expires_at);

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

-- ---------------------------------------------------------------------------
-- Domain events (event sourcing leve)
-- ---------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_domain_events_type_time
  ON platform.domain_events (event_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_domain_events_aggregate
  ON platform.domain_events (aggregate_type, aggregate_id, occurred_at);

-- ---------------------------------------------------------------------------
-- Product revisions + translations + quality
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_catalog.product_revisions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid NOT NULL REFERENCES product_catalog.products(id) ON DELETE CASCADE,
  revision        int NOT NULL,
  snapshot        jsonb NOT NULL,
  changed_fields  text[] NOT NULL DEFAULT '{}',
  changed_by      text,
  reason          text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, revision)
);

CREATE TABLE IF NOT EXISTS product_catalog.product_translations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid NOT NULL REFERENCES product_catalog.products(id) ON DELETE CASCADE,
  locale          text NOT NULL CHECK (locale IN ('pt-BR', 'en', 'es', 'jp')),
  title           text NOT NULL,
  description     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, locale)
);

ALTER TABLE product_catalog.products
  ADD COLUMN IF NOT EXISTS quality_score numeric(5, 2),
  ADD COLUMN IF NOT EXISTS quality_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Embeddings: jsonb por padrão; coluna vector opcional se extensão existir
CREATE TABLE IF NOT EXISTS product_catalog.product_embeddings (
  product_id      uuid PRIMARY KEY REFERENCES product_catalog.products(id) ON DELETE CASCADE,
  embedding_json  jsonb,
  model           text NOT NULL DEFAULT 'text-embedding-3-small',
  updated_at      timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
  ALTER TABLE product_catalog.product_embeddings
    ADD COLUMN IF NOT EXISTS embedding vector(1536);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pgvector unavailable — using embedding_json only';
END $$;

-- ---------------------------------------------------------------------------
-- Provider scheduler + import monitor
-- ---------------------------------------------------------------------------
ALTER TABLE product_catalog.provider_registry
  ADD COLUMN IF NOT EXISTS schedule_kind text DEFAULT 'manual'
    CHECK (schedule_kind IN ('every', 'hourly', 'daily', 'weekly', 'manual')),
  ADD COLUMN IF NOT EXISTS schedule_expr text,
  ADD COLUMN IF NOT EXISTS next_run_at timestamptz,
  ADD COLUMN IF NOT EXISTS rate_limit_rpm int,
  ADD COLUMN IF NOT EXISTS circuit_open_until timestamptz;

CREATE TABLE IF NOT EXISTS product_catalog.import_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     text NOT NULL,
  job_key         text NOT NULL,
  status          text NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed', 'partial')),
  started_at      timestamptz NOT NULL DEFAULT now(),
  finished_at     timestamptz,
  duration_ms     int,
  items_new       int NOT NULL DEFAULT 0,
  items_updated   int NOT NULL DEFAULT 0,
  items_failed    int NOT NULL DEFAULT 0,
  rate_limit_hits int NOT NULL DEFAULT 0,
  errors          jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_import_runs_provider
  ON product_catalog.import_runs (provider_id, started_at DESC);

COMMIT;
