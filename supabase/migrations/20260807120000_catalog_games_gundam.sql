-- ADR-016: Gundam Card Game — seed catalog_games (card ingest já existia; metadado faltava)

INSERT INTO tcg_judge.catalog_games
    (game_code, slug, display_name, description, logo_url, api_source, api_base_url, sort_order)
VALUES
    (
      'GUNDAM',
      'gundam',
      'Gundam Card Game',
      'Bandai Gundam Card Game (Newtype Rising e expansões).',
      '/logos/gundam.svg',
      'apitcg',
      'https://github.com/apitcg/gundam-tcg-data',
      14
    )
ON CONFLICT (game_code) DO UPDATE SET
    slug = EXCLUDED.slug,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    logo_url = EXCLUDED.logo_url,
    api_source = EXCLUDED.api_source,
    api_base_url = EXCLUDED.api_base_url,
    sort_order = EXCLUDED.sort_order,
    is_active = TRUE;

SELECT tcg_judge.refresh_catalog_game_counts();

-- Contagem por set (inclui beta = só cartas exclusivas do dump agregado)
UPDATE tcg_judge.card_sets cs
SET card_count = sub.n
FROM (
  SELECT set_code, count(*)::int AS n
  FROM tcg_judge.card_catalog
  WHERE game_code = 'GUNDAM'
    AND set_code IS NOT NULL
    AND set_code <> ''
  GROUP BY set_code
) sub
WHERE cs.game_code = 'GUNDAM'
  AND cs.code = sub.set_code;
