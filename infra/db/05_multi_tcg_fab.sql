-- Flesh and Blood + campos de versionamento semântico (idempotente)
SET search_path TO tcg_judge, public;

INSERT INTO games (tenant_id, slug, display_name, publisher, enabled, metadata)
SELECT t.id, 'fab', 'Flesh and Blood', 'Legend Story Studios', true, '{"tcg":true}'::jsonb
FROM tenants t
WHERE t.slug = 'default'
ON CONFLICT (tenant_id, slug) DO NOTHING;

ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS semantic_hash TEXT;
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS ontology_hash TEXT;
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS document_hash TEXT;

COMMENT ON COLUMN document_versions.semantic_hash IS 'Hash estável do normalizador semântico';
COMMENT ON COLUMN document_versions.ontology_hash IS 'Hash da ontologia aplicável ao documento';
COMMENT ON COLUMN document_versions.document_hash IS 'Alias explícito ao conteúdo (espelha content_hash)';

UPDATE document_versions SET document_hash = content_hash WHERE document_hash IS NULL;
