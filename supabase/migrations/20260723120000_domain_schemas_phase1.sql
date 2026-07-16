-- Fase 1 — Domain schemas (catalog / pricing / media / analytics / audit / platform)
-- Bridge: views opcionais; NÃO dropa tcg_judge.card_catalog.

BEGIN;

CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS pricing;
CREATE SCHEMA IF NOT EXISTS media;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS platform;

-- ---------------------------------------------------------------------------
-- catalog
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS catalog.catalog_games (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE,
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  publisher     text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog.catalog_sets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id       uuid NOT NULL REFERENCES catalog.catalog_games(id),
  code          text NOT NULL,
  name          text NOT NULL,
  release_date  date,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, code)
);

CREATE TABLE IF NOT EXISTS catalog.catalog_cards (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id          uuid NOT NULL REFERENCES catalog.catalog_games(id),
  set_id           uuid REFERENCES catalog.catalog_sets(id),
  name             text NOT NULL,
  normalized_name  text NOT NULL,
  card_number      text,
  rarity           text,
  language         text DEFAULT 'en',
  oracle_text      text,
  type_line        text,
  artist           text,
  game_data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_cards_game_name
  ON catalog.catalog_cards (game_id, normalized_name);

CREATE TABLE IF NOT EXISTS catalog.catalog_variants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id       uuid NOT NULL REFERENCES catalog.catalog_cards(id) ON DELETE CASCADE,
  finish        text,
  language      text,
  is_foil       boolean NOT NULL DEFAULT false,
  label         text,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog.provider_mappings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider              text NOT NULL,
  provider_object_type  text NOT NULL
    CHECK (provider_object_type IN ('CARD', 'SET', 'VARIANT', 'SEALED', 'DECK', 'TOKEN')),
  provider_card_id      text,
  provider_set_id       text,
  provider_variant_id   text,
  catalog_card_id       uuid REFERENCES catalog.catalog_cards(id) ON DELETE CASCADE,
  catalog_set_id        uuid REFERENCES catalog.catalog_sets(id) ON DELETE CASCADE,
  catalog_variant_id    uuid REFERENCES catalog.catalog_variants(id) ON DELETE CASCADE,
  metadata              jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_provider_mappings_object
  ON catalog.provider_mappings (
    provider,
    provider_object_type,
    COALESCE(provider_card_id, ''),
    COALESCE(provider_set_id, ''),
    COALESCE(provider_variant_id, '')
  );

CREATE TABLE IF NOT EXISTS catalog.catalog_legality (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id       uuid NOT NULL REFERENCES catalog.catalog_cards(id) ON DELETE CASCADE,
  format        text NOT NULL,
  status        text NOT NULL,
  UNIQUE (card_id, format)
);

CREATE TABLE IF NOT EXISTS catalog.catalog_rulings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id       uuid NOT NULL REFERENCES catalog.catalog_cards(id) ON DELETE CASCADE,
  published_at  date,
  text          text NOT NULL,
  source        text
);

-- ---------------------------------------------------------------------------
-- media
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media.media_assets (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type             text NOT NULL,
  owner_type       text NOT NULL,
  owner_id         uuid NOT NULL,
  provider         text,
  original_url     text,
  etag             text,
  sha256           text,
  perceptual_hash  text,
  mime             text,
  filesize         bigint,
  width            int,
  height           int,
  storage_key      text,
  cdn_url          text,
  variants         jsonb NOT NULL DEFAULT '{}'::jsonb,
  formats          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_sha256 ON media.media_assets (sha256)
  WHERE sha256 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_assets_phash ON media.media_assets (perceptual_hash)
  WHERE perceptual_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_assets_owner ON media.media_assets (owner_type, owner_id);

-- ---------------------------------------------------------------------------
-- pricing
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing.pricing_markets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE,
  name          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pricing.price_snapshots (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_card_id  uuid NOT NULL,
  variant_id       uuid,
  market_id        uuid NOT NULL REFERENCES pricing.pricing_markets(id),
  min_price        numeric(18, 6),
  avg_price        numeric(18, 6),
  market_price     numeric(18, 6),
  max_price        numeric(18, 6),
  currency         text NOT NULL CHECK (currency IN ('USD', 'EUR', 'JPY')),
  condition        text,
  printing         text,
  language         text,
  finish           text,
  seller_count     int,
  last_sale        numeric(18, 6),
  last_sale_date   date,
  recorded_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_snapshots_card
  ON pricing.price_snapshots (catalog_card_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS pricing.price_history (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_card_id  uuid NOT NULL,
  variant_id       uuid,
  market_id        uuid NOT NULL REFERENCES pricing.pricing_markets(id),
  price            numeric(18, 6) NOT NULL,
  currency         text NOT NULL,
  condition        text,
  finish           text,
  recorded_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pricing.currencies (
  code          text PRIMARY KEY,
  name          text NOT NULL
);

INSERT INTO pricing.currencies (code, name) VALUES
  ('USD', 'US Dollar'),
  ('EUR', 'Euro'),
  ('JPY', 'Japanese Yen')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS pricing.currency_rates (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base                text NOT NULL,
  quote               text NOT NULL,
  rate                numeric(24, 12) NOT NULL,
  as_of               timestamptz NOT NULL,
  exchange_provider   text NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (base, quote, exchange_provider, as_of)
);

-- ---------------------------------------------------------------------------
-- analytics (events → aggregators → marts)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analytics.analytics_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event         text NOT NULL,
  version       int NOT NULL DEFAULT 1,
  aggregate_id  text,
  request_id    text,
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at   timestamptz NOT NULL,
  ingested_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_time
  ON analytics.analytics_events (event, occurred_at DESC);

CREATE TABLE IF NOT EXISTS analytics.daily_prices (
  day              date NOT NULL,
  catalog_card_id  uuid NOT NULL,
  market_code      text NOT NULL,
  currency         text NOT NULL,
  min_price        numeric(18, 6),
  avg_price        numeric(18, 6),
  max_price        numeric(18, 6),
  PRIMARY KEY (day, catalog_card_id, market_code, currency)
);

CREATE TABLE IF NOT EXISTS analytics.market_trends (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_code     text,
  period        text NOT NULL,
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics.most_searched (
  day           date NOT NULL,
  query         text NOT NULL,
  count         bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (day, query)
);

CREATE TABLE IF NOT EXISTS analytics.most_viewed (
  day               date NOT NULL,
  catalog_card_id   uuid NOT NULL,
  views             bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (day, catalog_card_id)
);

CREATE TABLE IF NOT EXISTS analytics.price_variation (
  day               date NOT NULL,
  catalog_card_id   uuid NOT NULL,
  currency          text NOT NULL,
  pct_change        numeric(12, 6),
  PRIMARY KEY (day, catalog_card_id, currency)
);

CREATE TABLE IF NOT EXISTS analytics.sales_rank (
  day               date NOT NULL,
  catalog_card_id   uuid NOT NULL,
  rank              int NOT NULL,
  volume            bigint,
  PRIMARY KEY (day, catalog_card_id)
);

-- ---------------------------------------------------------------------------
-- audit
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit.audit_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor         text,
  action        text NOT NULL,
  resource_type text,
  resource_id   text,
  request_id    text,
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit.entity_changes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   text NOT NULL,
  entity_id     text NOT NULL,
  field         text NOT NULL,
  old_value     jsonb,
  new_value     jsonb,
  request_id    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit.sync_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id   text NOT NULL,
  game_code     text,
  status        text NOT NULL,
  mode          text,
  cards_synced  int NOT NULL DEFAULT 0,
  error_message text,
  started_at    timestamptz NOT NULL DEFAULT now(),
  finished_at   timestamptz
);

CREATE TABLE IF NOT EXISTS audit.job_executions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue         text NOT NULL,
  job_id        text NOT NULL,
  job_name      text,
  priority      text,
  status        text NOT NULL,
  attempts      int NOT NULL DEFAULT 0,
  request_id    text,
  provider_id   text,
  game_code     text,
  error_message text,
  started_at    timestamptz NOT NULL DEFAULT now(),
  finished_at   timestamptz
);

-- ---------------------------------------------------------------------------
-- platform (registry, flags, search projection version)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platform.providers (
  id            text PRIMARY KEY,
  kind          text NOT NULL CHECK (kind IN ('catalog', 'pricing', 'currency', 'media')),
  display_name  text NOT NULL,
  capabilities  jsonb NOT NULL DEFAULT '{}'::jsonb,
  rollout_mode  text NOT NULL DEFAULT 'OFF'
    CHECK (rollout_mode IN ('OFF', 'SHADOW', 'CANARY', 'LIVE')),
  canary_percent int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform.provider_health (
  provider_id         text PRIMARY KEY REFERENCES platform.providers(id) ON DELETE CASCADE,
  status              text NOT NULL DEFAULT 'unknown',
  last_success_at     timestamptz,
  last_error_at       timestamptz,
  last_error_message  text,
  uptime_ratio        numeric(8, 6),
  avg_latency_ms      numeric(12, 3),
  error_rate          numeric(8, 6),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform.provider_statistics (
  provider_id         text PRIMARY KEY REFERENCES platform.providers(id) ON DELETE CASCADE,
  requests_today      bigint NOT NULL DEFAULT 0,
  requests_total      bigint NOT NULL DEFAULT 0,
  quota_remaining     bigint,
  quota_limit         bigint,
  sync_cards_total    bigint NOT NULL DEFAULT 0,
  sync_errors_total   bigint NOT NULL DEFAULT 0,
  credits             numeric(18, 6),
  estimated_cost      numeric(18, 6),
  daily_cost          numeric(18, 6),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform.feature_flags (
  key           text PRIMARY KEY,
  enabled       boolean NOT NULL DEFAULT false,
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform.provider_flags (
  provider_id   text NOT NULL REFERENCES platform.providers(id) ON DELETE CASCADE,
  key           text NOT NULL,
  enabled       boolean NOT NULL DEFAULT true,
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (provider_id, key)
);

CREATE TABLE IF NOT EXISTS platform.game_flags (
  game_code     text NOT NULL,
  key           text NOT NULL,
  enabled       boolean NOT NULL DEFAULT true,
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (game_code, key)
);

CREATE TABLE IF NOT EXISTS platform.search_index_projections (
  name          text PRIMARY KEY,
  version       int NOT NULL,
  status        text NOT NULL DEFAULT 'building'
    CHECK (status IN ('building', 'live', 'draining', 'retired')),
  document_count bigint NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  activated_at  timestamptz
);

INSERT INTO platform.search_index_projections (name, version, status)
VALUES ('cards_v1', 1, 'live')
ON CONFLICT DO NOTHING;

INSERT INTO platform.providers (id, kind, display_name, capabilities, rollout_mode)
VALUES (
  'scryfall',
  'catalog',
  'Scryfall',
  '{"cards":true,"images":true,"variants":true,"prices":false,"legality":true,"rulings":true,"languages":true,"sealed":false,"decks":false,"metadata":true}'::jsonb,
  'SHADOW'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO platform.provider_health (provider_id, status)
VALUES ('scryfall', 'unknown')
ON CONFLICT DO NOTHING;

INSERT INTO platform.provider_statistics (provider_id)
VALUES ('scryfall')
ON CONFLICT DO NOTHING;

COMMIT;
