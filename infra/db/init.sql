-- Extensões (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;
-- UUID: gen_random_uuid() (Supabase/RDS PG13+); evita uuid-ossp em schema extensions

-- Schema inicial alinhado a multi-tenant / jogos dinâmicos
CREATE SCHEMA IF NOT EXISTS tcg_judge;

SET search_path TO tcg_judge, public;

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    display_name TEXT NOT NULL,
    publisher TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    default_locale TEXT NOT NULL DEFAULT 'en',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL,
    title TEXT NOT NULL,
    source_url TEXT NOT NULL,
    publisher TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en',
    region TEXT,
    format TEXT,
    version_label TEXT,
    content_hash TEXT NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    indexed_at TIMESTAMPTZ,
    raw_mime TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE (game_id, source_url, content_hash)
);

CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_label TEXT,
    effective_from DATE,
    effective_to DATE,
    superseded_by UUID REFERENCES document_versions(id) ON DELETE SET NULL,
    content_hash TEXT NOT NULL,
    diff_summary JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_versions_effective
    ON document_versions (document_id, effective_from, effective_to);

CREATE TABLE IF NOT EXISTS rule_graph_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS rule_graph_edge_quality (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Dimensão 1536 = text-embedding-3-large com parâmetro dimensions=1536 (Matryoshka)
CREATE TABLE IF NOT EXISTS chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    section_path TEXT,
    text TEXT NOT NULL,
    token_count INT,
    embedding vector(1536),
    bm25_document_id TEXT GENERATED ALWAYS AS (document_id::text) STORED,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    rule_path TEXT,
    parent_rule_path TEXT,
    hierarchy_level INT NOT NULL DEFAULT 0,
    title TEXT,
    subsection TEXT,
    semantic_path TEXT,
    content_sha256 CHAR(64),
    parent_chunk_id UUID REFERENCES chunks(id) DEFERRABLE INITIALLY DEFERRED,
    version_label TEXT,
    UNIQUE (document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_chunks_document ON chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_metadata_gin ON chunks USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_chunks_rule_path ON chunks(rule_path);
CREATE INDEX IF NOT EXISTS idx_chunks_parent_rule ON chunks(parent_rule_path);
CREATE INDEX IF NOT EXISTS idx_chunks_hierarchy ON chunks(hierarchy_level);
CREATE INDEX IF NOT EXISTS idx_chunks_fts ON chunks USING gin (to_tsvector('english', text));

-- Índice vetorial: criar após carga inicial (IVFFlat/HNSW exige volume mínimo).
-- Ex.: CREATE INDEX idx_chunks_embedding_hnsw ON chunks USING hnsw (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    display_name TEXT,
    auth_provider TEXT,
    external_sub TEXT,
    role TEXT NOT NULL DEFAULT 'player',
    tier TEXT NOT NULL DEFAULT 'free',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (auth_provider, external_sub)
);

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    mode TEXT NOT NULL DEFAULT 'player',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    citations JSONB,
    model TEXT,
    confidence NUMERIC(5, 4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    crawler_key TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id UUID,
    action TEXT NOT NULL,
    resource TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO tenants (slug, name)
VALUES ('default', 'TCG Judge Default')
ON CONFLICT (slug) DO NOTHING;

-- Seeds dos 10 jogos iniciais (habilitados)
INSERT INTO games (tenant_id, slug, display_name, publisher, enabled, metadata)
SELECT t.id, v.slug, v.display_name, v.publisher, true, v.metadata::jsonb
FROM tenants t
CROSS JOIN (VALUES
    ('mtg', 'Magic: The Gathering', 'Wizards of the Coast', '{"tcg":true}'),
    ('pokemon', 'Pokémon TCG', 'The Pokémon Company', '{"tcg":true}'),
    ('yugioh', 'Yu-Gi-Oh!', 'Konami', '{"tcg":true}'),
    ('onepiece', 'One Piece Card Game', 'Bandai', '{"tcg":true}'),
    ('lorcana', 'Disney Lorcana', 'Ravensburger', '{"tcg":true}'),
    ('swu', 'Star Wars: Unlimited', 'Fantasy Flight Games', '{"tcg":true}'),
    ('digimon', 'Digimon Card Game', 'Bandai', '{"tcg":true}'),
    ('dbfw', 'Dragon Ball Super Fusion World', 'Bandai', '{"tcg":true}'),
    ('gundam', 'Gundam Card Game', 'Bandai', '{"tcg":true}'),
    ('riftbound', 'Riftbound', 'Unknown Publisher', '{"tcg":true}')
) AS v(slug, display_name, publisher, metadata)
WHERE t.slug = 'default'
ON CONFLICT (tenant_id, slug) DO NOTHING;
