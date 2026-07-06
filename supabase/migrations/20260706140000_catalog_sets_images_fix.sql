-- Auditoria catálogo: seed de expansões mínimas + normalização de image_uris

-- Backfill image_uris a partir de image_url quando vazio
UPDATE tcg_judge.card_catalog
SET image_uris = jsonb_build_object(
    'small', image_url,
    'normal', image_url,
    'large', image_url
)
WHERE image_url IS NOT NULL
  AND image_url <> ''
  AND (image_uris IS NULL OR image_uris = '{}'::jsonb OR image_uris->>'normal' IS NULL);

-- Expansões mínimas obrigatórias (metadados em card_sets; cartas permanecem em card_catalog)
INSERT INTO tcg_judge.card_sets (game_code, code, name, release_date, card_count)
VALUES
    -- Pokémon
    ('POKEMON', 'sv3pt5', '151', '2023-09-22', 207),
    ('POKEMON', 'sv3', 'Paldea Evolved', '2023-06-09', 279),
    ('POKEMON', 'sv8', 'Surging Sparks', '2024-11-08', 252),
    -- Magic
    ('MTG', 'blb', 'Bloomburrow', '2024-08-02', 281),
    ('MTG', 'dsk', 'Duskmourn: House of Horror', '2024-09-27', 286),
    ('MTG', 'fdn', 'Foundations', '2024-11-15', 291),
    ('MTG', 'mh3', 'Modern Horizons 3', '2024-06-07', 303),
    -- One Piece OP-01 … OP-15
    ('ONEPIECE', 'OP-01', 'Romance Dawn', '2022-07-08', 121),
    ('ONEPIECE', 'OP-02', 'Paramount War', '2022-11-04', 121),
    ('ONEPIECE', 'OP-03', 'Pillars of Strength', '2023-02-10', 121),
    ('ONEPIECE', 'OP-04', 'Kingdoms of Intrigue', '2023-05-26', 121),
    ('ONEPIECE', 'OP-05', 'Awakening of the New Era', '2023-08-25', 121),
    ('ONEPIECE', 'OP-06', 'Wings of the Captain', '2023-11-24', 121),
    ('ONEPIECE', 'OP-07', '500 Years in the Future', '2024-02-23', 121),
    ('ONEPIECE', 'OP-08', 'Two Legends', '2024-05-24', 121),
    ('ONEPIECE', 'OP-09', 'Emperors in the New World', '2024-08-23', 121),
    ('ONEPIECE', 'OP-10', 'Royal Blood', '2024-11-22', 121),
    ('ONEPIECE', 'OP-11', 'A Fist of Divine Speed', '2025-02-28', 121),
    ('ONEPIECE', 'OP-12', 'Legacy of the Master', '2025-05-23', 121),
    ('ONEPIECE', 'OP-13', 'Carrying on His Will', '2025-08-22', 121),
    ('ONEPIECE', 'OP-14', 'The Azure Sea''s Seven', '2025-11-21', 121),
    ('ONEPIECE', 'OP-15', 'Adventure of the Island of Rare Animals', '2026-02-27', 121),
    -- Yu-Gi-Oh!
    ('YGO', 'RA01', '25th Anniversary Rarity Collection', '2023-01-26', 75),
    ('YGO', 'LEDE', 'Legacy of Destruction', '2024-05-03', 100),
    ('YGO', 'RA02', '25th Anniversary Rarity Collection II', '2024-02-23', 80),
    -- Disney Lorcana (The First Chapter → Reign of Jafar / linha principal)
    ('LORCANA', 'TFC', 'The First Chapter', '2023-08-18', 204),
    ('LORCANA', 'ROF', 'Rise of the Floodborn', '2023-09-29', 204),
    ('LORCANA', 'ITI', 'Into the Inklands', '2024-02-23', 204),
    ('LORCANA', 'URS', 'Ursula''s Return', '2024-05-17', 204),
    ('LORCANA', 'SSK', 'Shimmering Skies', '2024-08-09', 204),
    ('LORCANA', 'AZS', 'Azurite Sea', '2024-11-15', 204),
    ('LORCANA', 'ARI', 'Archazia''s Island', '2025-03-07', 204),
    ('LORCANA', 'ROJ', 'Reign of Jafar', '2025-05-30', 204),
    ('LORCANA', 'FAB', 'Fabled', '2025-08-22', 204),
    ('LORCANA', 'AOV', 'Attack of the Vines', '2025-10-24', 204)
ON CONFLICT (game_code, code) DO UPDATE SET
    name = EXCLUDED.name,
    release_date = COALESCE(EXCLUDED.release_date, tcg_judge.card_sets.release_date),
    card_count = COALESCE(EXCLUDED.card_count, tcg_judge.card_sets.card_count);

-- Atualiza contagem de jogos após seed
SELECT tcg_judge.refresh_catalog_game_counts();
