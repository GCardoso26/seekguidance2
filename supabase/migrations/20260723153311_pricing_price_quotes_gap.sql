-- Gap fill: pricing quotes tables missing from partial pricing_inventory_platform apply
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
