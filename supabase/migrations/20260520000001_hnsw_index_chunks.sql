-- Migration: índice HNSW na tabela chunks para busca vetorial eficiente
-- CREATE INDEX CONCURRENTLY não pode correr dentro de BEGIN/COMMIT — aplicar cada statement isolado.
-- Supabase Dashboard > SQL Editor ou: psql -f este ficheiro (statement a statement)
--
-- m=16, ef_construction=64: equilíbrio recall/velocidade para corpus TCG
-- Para mais recall em queries: SET hnsw.ef_search = 100; (por sessão)

CREATE INDEX CONCURRENTLY IF NOT EXISTS chunks_embedding_hnsw_idx
ON tcg_judge.chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Filtro por documento antes do join com games (chunks não têm game_slug)
CREATE INDEX CONCURRENTLY IF NOT EXISTS chunks_document_embedding_idx
ON tcg_judge.chunks (document_id)
WHERE embedding IS NOT NULL;

COMMENT ON INDEX tcg_judge.chunks_embedding_hnsw_idx IS
  'HNSW para busca vetorial aproximada. m=16, ef_construction=64. Ajustar hnsw.ef_search por sessão se necessário.';
