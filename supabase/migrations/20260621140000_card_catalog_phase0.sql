-- Fase 0: catálogo unificado de cartas (marketplace + torneios)

SET search_path TO tcg_judge, public;

ALTER TABLE card_catalog ADD COLUMN IF NOT EXISTS external_ids JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE card_catalog ADD COLUMN IF NOT EXISTS image_uris JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE card_catalog ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';
ALTER TABLE card_catalog ADD COLUMN IF NOT EXISTS source VARCHAR(40);
ALTER TABLE card_catalog ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;
ALTER TABLE card_catalog ADD COLUMN IF NOT EXISTS is_reprint BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE card_catalog ADD COLUMN IF NOT EXISTS original_card_id UUID REFERENCES card_catalog(id);
ALTER TABLE card_catalog ADD COLUMN IF NOT EXISTS set_release_date DATE;

UPDATE card_catalog
SET external_ids = jsonb_build_object(
  CASE game_code
    WHEN 'MTG' THEN 'scryfall'
    WHEN 'POKEMON' THEN 'pokemonTcgApi'
    WHEN 'LORCANA' THEN 'lorcanaApi'
    WHEN 'YGO' THEN 'ygoprodeck'
    ELSE 'external'
  END,
  external_id
),
image_uris = CASE
  WHEN image_url IS NOT NULL AND image_url <> '' THEN jsonb_build_object('normal', image_url)
  ELSE '{}'::jsonb
END,
source = COALESCE(source, lower(game_code))
WHERE external_ids = '{}'::jsonb OR external_ids IS NULL;

CREATE TABLE IF NOT EXISTS card_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES card_catalog(id) ON DELETE CASCADE,
  source VARCHAR(40) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  price_cents INT NOT NULL,
  condition VARCHAR(10),
  foil BOOLEAN NOT NULL DEFAULT FALSE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_card_prices_card ON card_prices(card_id);
CREATE INDEX IF NOT EXISTS idx_card_prices_recorded ON card_prices(recorded_at DESC);

CREATE TABLE IF NOT EXISTS card_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_code VARCHAR(10) NOT NULL,
  source VARCHAR(40) NOT NULL,
  status VARCHAR(20) NOT NULL,
  cards_synced INT NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_card_sync_runs_game ON card_sync_runs(game_code, started_at DESC);

-- Busca full-text (fallback quando Meilisearch indisponível)
CREATE INDEX IF NOT EXISTS idx_card_catalog_search
  ON card_catalog USING gin(to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(set_name, '')));
