-- Feedback de retrieval + qualidade de arestas (idempotente)
SET search_path TO tcg_judge, public;

CREATE TABLE IF NOT EXISTS rule_graph_edge_quality (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    src_rule TEXT NOT NULL,
    dst_rule TEXT NOT NULL,
    relation TEXT NOT NULL,
    usage_count INT NOT NULL DEFAULT 0,
    successful_retrievals INT NOT NULL DEFAULT 0,
    failed_retrievals INT NOT NULL DEFAULT 0,
    reinforcement_score DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    drift_risk_score DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    decay_factor DOUBLE PRECISION NOT NULL DEFAULT 0.995,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (game_id, src_rule, dst_rule, relation)
);

CREATE INDEX IF NOT EXISTS idx_edge_quality_game_score
    ON rule_graph_edge_quality (game_id, reinforcement_score DESC);

CREATE TABLE IF NOT EXISTS retrieval_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    query_id UUID,
    query TEXT NOT NULL,
    intent TEXT NOT NULL,
    graph_edges_used JSONB NOT NULL DEFAULT '[]'::jsonb,
    retrieval_reasoning_path JSONB NOT NULL DEFAULT '[]'::jsonb,
    final_confidence DOUBLE PRECISION NOT NULL,
    citation_quality DOUBLE PRECISION,
    token_efficiency DOUBLE PRECISION,
    retrieval_quality_score DOUBLE PRECISION,
    graph_quality_score DOUBLE PRECISION,
    hallucination_risk DOUBLE PRECISION,
    retrieval_success BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_retrieval_feedback_game_created
    ON retrieval_feedback (game_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_retrieval_feedback_query_id
    ON retrieval_feedback (query_id);
