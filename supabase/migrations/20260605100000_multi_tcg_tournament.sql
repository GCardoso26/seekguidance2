-- Sistema de Torneios Multi-TCG (POKEMON, LORCANA, MTG, SWU)

SET search_path TO tcg_judge, public;

-- Formatos de torneio por jogo
CREATE TABLE IF NOT EXISTS game_formats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_code VARCHAR(10) NOT NULL,
  code VARCHAR(30) NOT NULL,
  name VARCHAR(80) NOT NULL,
  description TEXT,
  decklist_required BOOLEAN NOT NULL DEFAULT true,
  decklist_validation BOOLEAN NOT NULL DEFAULT true,
  default_timer_minutes INT NOT NULL DEFAULT 50,
  default_match_type VARCHAR(5) NOT NULL DEFAULT 'BO3'
    CHECK (default_match_type IN ('BO1', 'BO3', 'BO5', 'FFA')),
  default_swiss_rounds VARCHAR(10) NOT NULL DEFAULT 'auto',
  default_top_cut INT,
  min_players INT NOT NULL DEFAULT 4,
  max_players INT NOT NULL DEFAULT 512,
  decklist_validation_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_code, code)
);

CREATE INDEX IF NOT EXISTS idx_game_formats_game ON game_formats(game_code, active);

-- Catálogo unificado de cartas jogáveis
CREATE TABLE IF NOT EXISTS card_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_code VARCHAR(10) NOT NULL,
  external_id VARCHAR(80) NOT NULL,
  set_code VARCHAR(20),
  set_name VARCHAR(120),
  card_number VARCHAR(20),
  name VARCHAR(200) NOT NULL,
  normalized_name VARCHAR(200) NOT NULL,
  rarity VARCHAR(30),
  card_type VARCHAR(80),
  game_specific_type VARCHAR(80),
  legality JSONB NOT NULL DEFAULT '{}'::jsonb,
  image_url TEXT,
  game_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_code, external_id)
);

CREATE INDEX IF NOT EXISTS idx_card_catalog_normalized_name
  ON card_catalog(normalized_name);
CREATE INDEX IF NOT EXISTS idx_card_catalog_game_name
  ON card_catalog(game_code, normalized_name);
CREATE INDEX IF NOT EXISTS idx_card_catalog_legality
  ON card_catalog(game_code, (legality->>'STANDARD'));

-- Extensão da tabela tournaments
ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS game_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS format_code VARCHAR(30),
  ADD COLUMN IF NOT EXISTS match_type VARCHAR(5) DEFAULT 'BO3',
  ADD COLUMN IF NOT EXISTS timer_minutes INT,
  ADD COLUMN IF NOT EXISTS top_cut INT,
  ADD COLUMN IF NOT EXISTS swiss_rounds VARCHAR(10) DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS decklist_required BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_players INT DEFAULT 128;

-- Marcar jogos V1 como ativos para torneios
UPDATE games
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'tournament_enabled', true,
  'tournament_code', UPPER(slug),
  'card_sync_endpoint', CASE slug
    WHEN 'mtg' THEN 'https://api.scryfall.com'
    WHEN 'pokemon' THEN 'https://api.tcgdex.net/v2'
    WHEN 'lorcana' THEN 'https://lorcanajson.org'
    WHEN 'swu' THEN 'internal'
    ELSE NULL
  END
)
WHERE slug IN ('pokemon', 'lorcana', 'mtg', 'swu');

-- Formatos iniciais
INSERT INTO game_formats (
  game_code, code, name, description,
  decklist_required, decklist_validation,
  default_timer_minutes, default_match_type,
  default_swiss_rounds, default_top_cut,
  decklist_validation_rules
) VALUES
  ('POKEMON', 'STANDARD', 'Standard', 'Rotation oficial TPCi', true, true, 50, 'BO3', 'auto', 8,
   '{"min_cards":60,"max_cards":60,"max_copies":4,"energy_unlimited":true}'::jsonb),
  ('POKEMON', 'EXPANDED', 'Expanded', 'Formato Expanded', true, true, 50, 'BO3', 'auto', 8,
   '{"min_cards":60,"max_cards":60,"max_copies":4,"energy_unlimited":true}'::jsonb),
  ('POKEMON', 'LIMITED', 'Limited', 'Prerelease / Sealed', false, false, 50, 'BO3', 'auto', 8, '{}'::jsonb),
  ('LORCANA', 'CONSTRUCTED', 'Constructed', '60 cartas, chapter rotation', true, true, 55, 'BO3', 'auto', 8,
   '{"min_cards":60,"max_cards":60,"max_copies":4}'::jsonb),
  ('LORCANA', 'LIMITED', 'Limited', 'Draft / Sealed Lorcana', false, false, 55, 'BO3', 'auto', 8, '{}'::jsonb),
  ('MTG', 'STANDARD', 'Standard', 'Formato Standard DCI', true, true, 50, 'BO3', 'auto', 8,
   '{"min_cards":60,"max_copies":4,"sideboard_max":15}'::jsonb),
  ('MTG', 'PIONEER', 'Pioneer', 'Sets de Ravnica em diante', true, true, 50, 'BO3', 'auto', 8,
   '{"min_cards":60,"max_copies":4,"sideboard_max":15}'::jsonb),
  ('MTG', 'MODERN', 'Modern', 'Formato Modern', true, true, 50, 'BO3', 'auto', 8,
   '{"min_cards":60,"max_copies":4,"sideboard_max":15}'::jsonb),
  ('MTG', 'DRAFT', 'Draft', '3 rodadas Swiss + Top 4', false, false, 50, 'BO3', '3', 4, '{}'::jsonb),
  ('MTG', 'SEALED', 'Sealed', 'Sealed Deck', false, false, 50, 'BO3', 'auto', 8, '{}'::jsonb),
  ('MTG', 'COMMANDER', 'Commander', 'EDH — pods e pontos', true, true, 90, 'FFA', 'auto', NULL,
   '{"min_cards":100,"max_cards":100,"max_copies":1,"singleton":true}'::jsonb),
  ('SWU', 'STANDARD', 'Standard', 'Constructed SWU', true, true, 55, 'BO3', 'auto', 8,
   '{"min_cards":50,"max_cards":50,"max_copies":3}'::jsonb),
  ('SWU', 'LIMITED', 'Limited', 'Draft / Sealed SWU', false, false, 55, 'BO3', 'auto', 8, '{}'::jsonb)
ON CONFLICT (game_code, code) DO NOTHING;

-- Cartas seed para autocomplete (amostra representativa)
INSERT INTO card_catalog (
  game_code, external_id, set_code, set_name, card_number, name, normalized_name,
  rarity, card_type, game_specific_type, legality, image_url, game_data
) VALUES
  ('MTG', 'lightning-bolt', 'LEA', 'Limited Edition Alpha', '161', 'Lightning Bolt', 'lightning bolt',
   'common', 'Instant', 'instant',
   '{"STANDARD":"not_legal","MODERN":"legal","PIONEER":"legal"}'::jsonb, NULL,
   '{"mana_cost":"{R}","cmc":1,"colors":["R"]}'::jsonb),
  ('MTG', 'counterspell', 'LEA', 'Limited Edition Alpha', '63', 'Counterspell', 'counterspell',
   'uncommon', 'Instant', 'instant',
   '{"STANDARD":"not_legal","MODERN":"legal","PIONEER":"legal"}'::jsonb, NULL,
   '{"mana_cost":"{U}{U}","cmc":2,"colors":["U"]}'::jsonb),
  ('POKEMON', 'pikachu-ss', 'SSH', 'Sword & Shield', '25', 'Pikachu', 'pikachu',
   'common', 'Pokémon', 'basic',
   '{"STANDARD":"legal","EXPANDED":"legal"}'::jsonb, NULL,
   '{"hp":60,"type":"Lightning","stage":"Basic"}'::jsonb),
  ('POKEMON', 'basic-lightning-energy', 'SVE', 'Shining Fates', '9', 'Lightning Energy', 'lightning energy',
   'common', 'Energy', 'basic_energy',
   '{"STANDARD":"legal","EXPANDED":"legal"}'::jsonb, NULL,
   '{"type":"Lightning"}'::jsonb),
  ('LORCANA', 'elsa-snow-queen', 'TFC', 'The First Chapter', '35', 'Elsa - Snow Queen', 'elsa snow queen',
   'rare', 'Character', 'character',
   '{"CONSTRUCTED":"legal"}'::jsonb, NULL,
   '{"ink_cost":4,"inkable":true,"classification":"Storyborn"}'::jsonb),
  ('SWU', 'luke-skywalker', 'SOR', 'Spark of Rebellion', '1', 'Luke Skywalker', 'luke skywalker',
   'legendary', 'Unit', 'leader',
   '{"STANDARD":"legal"}'::jsonb, NULL,
   '{"aspect":"Heroism","cost":5}'::jsonb)
ON CONFLICT (game_code, external_id) DO NOTHING;
