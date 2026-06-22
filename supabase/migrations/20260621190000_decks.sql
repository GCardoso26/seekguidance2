-- Fase 1.7: Deckbuilder — decks normalizados + deck_cards

SET search_path TO tcg_judge, public;

DO $$ BEGIN
  CREATE TYPE tcg_judge.deck_zone AS ENUM ('main', 'sideboard', 'commander', 'companion');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  game VARCHAR(50) NOT NULL,
  format VARCHAR(50) NOT NULL DEFAULT 'standard',
  owner_id TEXT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  total_cards INTEGER NOT NULL DEFAULT 0,
  total_price INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deck_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES card_catalog(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  zone tcg_judge.deck_zone NOT NULL DEFAULT 'main',
  is_foil BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(deck_id, card_id, zone, is_foil)
);

CREATE INDEX IF NOT EXISTS idx_decks_owner ON decks(owner_id);
CREATE INDEX IF NOT EXISTS idx_decks_public ON decks(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deck_cards_deck ON deck_cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_cards_card ON deck_cards(card_id);

ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS decks_owner_all ON decks;
CREATE POLICY decks_owner_all ON decks
  FOR ALL USING (owner_id = current_setting('request.jwt.claim.sub', true))
  WITH CHECK (owner_id = current_setting('request.jwt.claim.sub', true));

DROP POLICY IF EXISTS decks_public_read ON decks;
CREATE POLICY decks_public_read ON decks
  FOR SELECT USING (is_public = TRUE);

DROP POLICY IF EXISTS deck_cards_owner ON deck_cards;
CREATE POLICY deck_cards_owner ON deck_cards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM decks d
      WHERE d.id = deck_cards.deck_id
        AND d.owner_id = current_setting('request.jwt.claim.sub', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM decks d
      WHERE d.id = deck_cards.deck_id
        AND d.owner_id = current_setting('request.jwt.claim.sub', true)
    )
  );

DROP POLICY IF EXISTS deck_cards_public_read ON deck_cards;
CREATE POLICY deck_cards_public_read ON deck_cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM decks d
      WHERE d.id = deck_cards.deck_id AND d.is_public = TRUE
    )
  );

DROP TRIGGER IF EXISTS decks_updated_at ON decks;
CREATE TRIGGER decks_updated_at
  BEFORE UPDATE ON decks
  FOR EACH ROW EXECUTE FUNCTION tcg_judge.update_updated_at_column();

COMMENT ON TABLE decks IS 'Decks de jogadores (deckbuilder)';
COMMENT ON TABLE deck_cards IS 'Cartas em decks por zona';

-- DOWN (rollback manual):
-- DROP TABLE IF EXISTS deck_cards;
-- DROP TABLE IF EXISTS decks;
-- DROP TYPE IF EXISTS tcg_judge.deck_zone;
