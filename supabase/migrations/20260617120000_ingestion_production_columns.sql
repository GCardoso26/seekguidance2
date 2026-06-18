-- Colunas de ingestão produção (alinhado a infra/db/06_ingestion_production.sql)

SET search_path TO tcg_judge, public;

ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_fingerprint TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS version_hash TEXT;

ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS version_hash TEXT;
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS document_fingerprint TEXT;

ALTER TABLE chunks ADD COLUMN IF NOT EXISTS semantic_fingerprint TEXT;
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS lineage_root_chunk_id UUID REFERENCES chunks(id) DEFERRABLE INITIALLY DEFERRED;

CREATE INDEX IF NOT EXISTS idx_documents_fingerprint ON documents (document_fingerprint);
CREATE INDEX IF NOT EXISTS idx_chunks_semantic_fingerprint ON chunks (semantic_fingerprint);
