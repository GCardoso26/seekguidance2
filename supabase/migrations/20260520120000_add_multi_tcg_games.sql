-- Jogos adicionais para ingestão RAG (FAB, Sorcery, Vanguard, Union Arena)
SET search_path TO tcg_judge, public;

INSERT INTO games (tenant_id, slug, display_name, publisher, enabled, metadata)
SELECT t.id, v.slug, v.display_name, v.publisher, true, v.metadata::jsonb
FROM tenants t
CROSS JOIN (VALUES
    ('fab', 'Flesh and Blood', 'Legend Story Studios', '{"tcg":true}'),
    ('sorcery', 'Sorcery: Contested Realm', 'Erik''s Curiosa', '{"tcg":true}'),
    ('vanguard', 'Cardfight!! Vanguard', 'Bushiroad', '{"tcg":true}'),
    ('union_arena', 'Union Arena', 'Bandai', '{"tcg":true}')
) AS v(slug, display_name, publisher, metadata)
WHERE t.slug = 'default'
ON CONFLICT (tenant_id, slug) DO UPDATE
SET display_name = EXCLUDED.display_name,
    publisher = EXCLUDED.publisher,
    enabled = true;
