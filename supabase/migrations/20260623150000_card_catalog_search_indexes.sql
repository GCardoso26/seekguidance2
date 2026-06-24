-- Índices adicionais para busca e ordenação no card_catalog

SET search_path TO tcg_judge, public;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_card_catalog_name_trgm
  ON card_catalog USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_card_catalog_set_code
  ON card_catalog (set_code);

CREATE INDEX IF NOT EXISTS idx_card_catalog_created_at
  ON card_catalog (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_card_catalog_game_created
  ON card_catalog (game_code, created_at DESC);

ANALYZE card_catalog;
