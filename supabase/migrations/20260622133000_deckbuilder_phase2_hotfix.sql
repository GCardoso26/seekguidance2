-- Deckbuilder Fase 2.0 + hotfixes de auditoria

-- =========================
-- HF2: RLS + sync status
-- =========================

ALTER TABLE IF EXISTS tcg_judge.catalog_games
  ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) NOT NULL DEFAULT 'idle'
  CHECK (sync_status IN ('idle', 'syncing', 'completed', 'failed'));

-- Recria policies de catalog_games com leitura pública e escrita admin/head_judge.
DROP POLICY IF EXISTS "catalog_games_public_read" ON tcg_judge.catalog_games;
CREATE POLICY "catalog_games_select_all"
  ON tcg_judge.catalog_games
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "catalog_games_admin_modify" ON tcg_judge.catalog_games;
CREATE POLICY "catalog_games_admin_modify"
  ON tcg_judge.catalog_games
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM tcg_judge.judge_profiles jp
      WHERE jp.id = (SELECT auth.uid())::text
        AND jp.role IN ('admin', 'head_judge')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM tcg_judge.judge_profiles jp
      WHERE jp.id = (SELECT auth.uid())::text
        AND jp.role IN ('admin', 'head_judge')
    )
  );

DROP POLICY IF EXISTS "card_sets_public_read" ON tcg_judge.card_sets;
CREATE POLICY "card_sets_select_all"
  ON tcg_judge.card_sets
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- =========================
-- Fase 2.0: formatos + coleção
-- =========================

CREATE TABLE IF NOT EXISTS tcg_judge.deck_formats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES tcg_judge.catalog_games(id) ON DELETE CASCADE,
  slug VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_deck_formats_game_active
  ON tcg_judge.deck_formats(game_id, is_active);

ALTER TABLE IF EXISTS tcg_judge.decks
  ADD COLUMN IF NOT EXISTS format_id UUID REFERENCES tcg_judge.deck_formats(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS game_id UUID REFERENCES tcg_judge.catalog_games(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_validated BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS tcg_judge.user_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES tcg_judge.player_profiles(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES tcg_judge.card_catalog(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  condition VARCHAR(20) NOT NULL DEFAULT 'NM',
  is_foil BOOLEAN NOT NULL DEFAULT FALSE,
  acquired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, card_id, condition, is_foil)
);

CREATE INDEX IF NOT EXISTS idx_user_collections_user
  ON tcg_judge.user_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_collections_card
  ON tcg_judge.user_collections(card_id);

ALTER TABLE tcg_judge.deck_formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE tcg_judge.user_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deck_formats_public_read" ON tcg_judge.deck_formats;
CREATE POLICY "deck_formats_public_read"
  ON tcg_judge.deck_formats
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "user_collections_select_own" ON tcg_judge.user_collections;
CREATE POLICY "user_collections_select_own"
  ON tcg_judge.user_collections
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "user_collections_modify_own" ON tcg_judge.user_collections;
CREATE POLICY "user_collections_modify_own"
  ON tcg_judge.user_collections
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

-- Seed base para MTG
INSERT INTO tcg_judge.deck_formats (game_id, slug, name, display_name, rules)
SELECT
  cg.id,
  f.slug,
  f.name,
  f.display_name,
  f.rules::jsonb
FROM tcg_judge.catalog_games cg
JOIN (
  VALUES
    (
      'commander',
      'commander',
      'Commander / EDH',
      '{
        "min_cards": 100,
        "max_cards": 100,
        "singleton": true,
        "commander_required": true,
        "max_copies": 1,
        "sideboard_max": 0
      }'
    ),
    (
      'standard',
      'standard',
      'Standard',
      '{
        "min_cards": 60,
        "max_cards": 250,
        "singleton": false,
        "commander_required": false,
        "max_copies": 4,
        "sideboard_max": 15
      }'
    ),
    (
      'modern',
      'modern',
      'Modern',
      '{
        "min_cards": 60,
        "max_cards": 250,
        "singleton": false,
        "commander_required": false,
        "max_copies": 4,
        "sideboard_max": 15
      }'
    ),
    (
      'pioneer',
      'pioneer',
      'Pioneer',
      '{
        "min_cards": 60,
        "max_cards": 250,
        "singleton": false,
        "commander_required": false,
        "max_copies": 4,
        "sideboard_max": 15
      }'
    ),
    (
      'legacy',
      'legacy',
      'Legacy',
      '{
        "min_cards": 60,
        "max_cards": 250,
        "singleton": false,
        "commander_required": false,
        "max_copies": 4,
        "sideboard_max": 15
      }'
    ),
    (
      'vintage',
      'vintage',
      'Vintage',
      '{
        "min_cards": 60,
        "max_cards": 250,
        "singleton": false,
        "commander_required": false,
        "max_copies": 4,
        "sideboard_max": 15
      }'
    ),
    (
      'pauper',
      'pauper',
      'Pauper',
      '{
        "min_cards": 60,
        "max_cards": 250,
        "singleton": false,
        "commander_required": false,
        "max_copies": 4,
        "sideboard_max": 15
      }'
    )
) AS f(slug, name, display_name, rules)
  ON TRUE
WHERE cg.slug = 'mtg'
ON CONFLICT (game_id, slug) DO UPDATE
SET
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name,
  rules = EXCLUDED.rules,
  is_active = TRUE;
