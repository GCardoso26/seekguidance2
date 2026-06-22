-- Biblioteca de TCGs: metadados de jogos + expansões (cartas permanecem em card_catalog)

CREATE TABLE IF NOT EXISTS tcg_judge.catalog_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_code VARCHAR(10) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    api_source VARCHAR(100),
    api_base_url TEXT,
    last_sync_at TIMESTAMPTZ,
    card_count INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tcg_judge.card_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_code VARCHAR(10) NOT NULL,
    external_id VARCHAR(100),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    release_date DATE,
    card_count INTEGER,
    icon_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (game_code, code)
);

CREATE INDEX IF NOT EXISTS idx_card_sets_game ON tcg_judge.card_sets(game_code);
CREATE INDEX IF NOT EXISTS idx_card_sets_code ON tcg_judge.card_sets(code);
CREATE INDEX IF NOT EXISTS idx_catalog_games_active ON tcg_judge.catalog_games(is_active, sort_order);

ALTER TABLE tcg_judge.catalog_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE tcg_judge.card_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog_games_public_read"
    ON tcg_judge.catalog_games FOR SELECT USING (is_active = TRUE);

CREATE POLICY "card_sets_public_read"
    ON tcg_judge.card_sets FOR SELECT USING (TRUE);

CREATE TRIGGER update_catalog_games_updated_at
    BEFORE UPDATE ON tcg_judge.catalog_games
    FOR EACH ROW EXECUTE FUNCTION tcg_judge.update_updated_at_column();

INSERT INTO tcg_judge.catalog_games
    (game_code, slug, display_name, description, logo_url, api_source, api_base_url, sort_order)
VALUES
    ('MTG', 'mtg', 'Magic: The Gathering', 'O TCG original. Mais de 25.000 cartas únicas.', '/logos/mtg.svg', 'scryfall', 'https://api.scryfall.com', 1),
    ('POKEMON', 'pokemon', 'Pokémon TCG', 'Colecione, batalhe e troque cartas Pokémon.', '/logos/pokemon.svg', 'tcgdex', 'https://api.tcgdex.net/v2', 2),
    ('YGO', 'yugioh', 'Yu-Gi-Oh!', 'Duelos estratégicos com monstros, magias e armadilhas.', '/logos/yugioh.svg', 'ygoprodeck', 'https://db.ygoprodeck.com/api/v7', 3),
    ('LORCANA', 'lorcana', 'Disney Lorcana', 'TCG Disney com mecânica de tinta e lore.', '/logos/lorcana.svg', 'lorcast', 'https://lorcast.com/api', 4),
    ('ONEPIECE', 'onepiece', 'One Piece TCG', 'Bandai One Piece Card Game.', '/logos/onepiece.svg', 'optcgapi', 'https://optcgapi.com', 5),
    ('FAB', 'fab', 'Flesh and Blood', 'TCG de combate heroico da Legend Story Studios.', '/logos/fab.svg', 'goagain', 'https://goagain.dev/api', 6),
    ('DIGIMON', 'digimon', 'Digimon TCG', 'Digimon Card Game da Bandai.', '/logos/digimon.svg', 'digimoncard', 'https://digimoncard.io/api-public', 7)
ON CONFLICT (game_code) DO UPDATE SET
    slug = EXCLUDED.slug,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    logo_url = EXCLUDED.logo_url,
    api_source = EXCLUDED.api_source,
    api_base_url = EXCLUDED.api_base_url,
    sort_order = EXCLUDED.sort_order;

CREATE OR REPLACE FUNCTION tcg_judge.refresh_catalog_game_counts()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE tcg_judge.catalog_games cg
    SET card_count = COALESCE(sub.cnt, 0),
        last_sync_at = COALESCE(sub.last_sync, cg.last_sync_at)
    FROM (
        SELECT
            cc.game_code,
            COUNT(*)::INTEGER AS cnt,
            MAX(cc.last_synced_at) AS last_sync
        FROM tcg_judge.card_catalog cc
        GROUP BY cc.game_code
    ) sub
    WHERE cg.game_code = sub.game_code;
END;
$$;
