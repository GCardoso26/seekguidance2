-- Idempotente: bases criadas antes do init.sql com colunas novas
SET search_path TO tcg_judge, public;

ALTER TABLE document_versions
    ADD COLUMN IF NOT EXISTS effective_to DATE,
    ADD COLUMN IF NOT EXISTS superseded_by UUID REFERENCES document_versions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_document_versions_effective
    ON document_versions (document_id, effective_from, effective_to);

CREATE TABLE IF NOT EXISTS rule_graph_edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    src_rule TEXT NOT NULL,
    dst_rule TEXT NOT NULL,
    relation TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (game_id, src_rule, dst_rule, relation)
);

CREATE INDEX IF NOT EXISTS idx_rule_graph_src ON rule_graph_edges (game_id, src_rule);
CREATE INDEX IF NOT EXISTS idx_rule_graph_dst ON rule_graph_edges (game_id, dst_rule);
