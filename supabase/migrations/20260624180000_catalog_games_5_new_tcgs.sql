-- Novos TCGs: Riftbound, Sorcery, Union Arena, DB Fusion World, Vanguard + SWU

INSERT INTO tcg_judge.catalog_games
    (game_code, slug, display_name, description, logo_url, api_source, api_base_url, sort_order)
VALUES
    ('SWU', 'swu', 'Star Wars: Unlimited', 'TCG de Star Wars da Fantasy Flight.', '/logos/swu.svg', 'swu-db', 'https://api.swu-db.com', 8),
    ('RIFTBOUND', 'riftbound', 'Riftbound', 'League of Legends TCG da Riot Games.', '/logos/riftbound.svg', 'riftscribe', 'https://riftscribe.gg/api', 9),
    ('SORCERY', 'sorcery', 'Sorcery: Contested Realms', 'TCG de fantasia old school da Erik''s Curiosa.', '/logos/sorcery.svg', 'sorcerytcg', 'https://api.sorcerytcg.com', 10),
    ('UARENA', 'union-arena', 'Union Arena', 'TCG crossover da Bandai (Naruto, Bleach, etc.).', '/logos/union-arena.svg', 'apitcg', 'https://www.apitcg.com', 11),
    ('DBFW', 'dbfw', 'Dragon Ball Super: Fusion World', 'TCG Dragon Ball Super Fusion World.', '/logos/dbfw.svg', 'apitcg', 'https://github.com/apitcg/dragon-ball-fusion-tcg-data', 12),
    ('VANGUARD', 'vanguard', 'Cardfight!! Vanguard', 'TCG de clãs da Bushiroad.', '/logos/vanguard.svg', 'justtcg', 'https://api.justtcg.com/v1', 13)
ON CONFLICT (game_code) DO UPDATE SET
    slug = EXCLUDED.slug,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    logo_url = EXCLUDED.logo_url,
    api_source = EXCLUDED.api_source,
    api_base_url = EXCLUDED.api_base_url,
    sort_order = EXCLUDED.sort_order,
    is_active = TRUE;
