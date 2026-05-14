-- Sprint 1: MTG RAG — colunas hierárquicas + FTS (executar após 01-init em instalações novas)
SET search_path TO tcg_judge, public;

ALTER TABLE chunks ADD COLUMN IF NOT EXISTS rule_path TEXT;
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS parent_rule_path TEXT;
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS hierarchy_level INT NOT NULL DEFAULT 0;
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS subsection TEXT;
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS semantic_path TEXT;
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS content_sha256 CHAR(64);
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS parent_chunk_id UUID REFERENCES chunks(id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS version_label TEXT;

CREATE INDEX IF NOT EXISTS idx_chunks_rule_path ON chunks(rule_path);
CREATE INDEX IF NOT EXISTS idx_chunks_parent_rule ON chunks(parent_rule_path);
CREATE INDEX IF NOT EXISTS idx_chunks_hierarchy ON chunks(hierarchy_level);

-- FTS sobre texto integral (sem coluna materializada; índice em expressão)
CREATE INDEX IF NOT EXISTS idx_chunks_fts ON chunks USING gin (to_tsvector('english', text));

COMMENT ON COLUMN chunks.rule_path IS 'Ex.: 603.3b — identificador canônico da regra CR/MTR';
COMMENT ON COLUMN chunks.semantic_path IS 'Caminho legível acumulado (ancestry + título)';
