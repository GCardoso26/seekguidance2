-- Wave 2C: erros de documentos, uploads PDF, métricas de resiliência

CREATE TABLE IF NOT EXISTS tcg_judge.document_errors (
    id BIGSERIAL PRIMARY KEY,
    game_slug TEXT NOT NULL,
    document_id UUID REFERENCES tcg_judge.documents(id) ON DELETE SET NULL,
    filename TEXT,
    stage TEXT NOT NULL,
    exception TEXT NOT NULL,
    stacktrace TEXT,
    chunk_id UUID,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_errors_game_created
    ON tcg_judge.document_errors (game_slug, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_document_errors_stage
    ON tcg_judge.document_errors (stage, created_at DESC);

CREATE TABLE IF NOT EXISTS tcg_judge.uploaded_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_slug TEXT NOT NULL,
    filename TEXT NOT NULL,
    checksum TEXT NOT NULL,
    pages INT,
    chunk_count INT NOT NULL DEFAULT 0,
    source_type TEXT NOT NULL DEFAULT 'local_document',
    uploaded_by TEXT,
    document_id UUID REFERENCES tcg_judge.documents(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uploaded_documents_game
    ON tcg_judge.uploaded_documents (game_slug, created_at DESC);

CREATE TABLE IF NOT EXISTS tcg_judge.resilience_events (
    id BIGSERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    component TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resilience_events_type
    ON tcg_judge.resilience_events (event_type, created_at DESC);

-- Enriquecer ingestion_jobs se colunas faltarem
ALTER TABLE tcg_judge.ingestion_jobs ADD COLUMN IF NOT EXISTS progress JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE tcg_judge.ingestion_jobs ADD COLUMN IF NOT EXISTS game_slug TEXT;
ALTER TABLE tcg_judge.ingestion_jobs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE tcg_judge.ingestion_jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
