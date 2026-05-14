# Sprint 1 — Ingestão MTG e RAG real

## Objetivo

Validar o pipeline ponta-a-ponta: descoberta/download de PDFs oficiais, parsing, chunking hierárquico (regras numeradas), persistência versionada, embeddings OpenAI (`text-embedding-3-large` com `dimensions=1536` alinhado ao `vector(1536)`), retrieval híbrido (FTS + pgvector + RRF), resposta em `/v1/chat/ask` com citações e score de confiança.

## Módulos

| Camada | Caminho |
|--------|---------|
| Crawler + parser + chunker + embeddings + repositório Postgres | `services/ingestion/tcg_judge_ingestion/` |
| Workers Redis (arq) | `services/workers/arq_worker.py` |
| Retrieval híbrido + LLM | `services/api/app/retrieval/`, `app/application/rag_orchestrator.py` |
| SQL (colunas hierárquicas, FTS, vector) | `infra/db/init.sql`, `infra/db/02_rag_mtg.sql` |
| CLI ingestão | `scripts/ingest_mtg.py` |

## Variáveis de ambiente (API e worker)

- `DATABASE_URL` — async (`postgresql+asyncpg://...`) na API; o worker converte para sync `postgresql://` ao usar `asyncpg`/`psycopg` conforme o repositório.
- `REDIS_URL`
- `OPENAI_API_KEY` — obrigatório para embeddings no worker e para o LLM no ask.
- `OPENAI_EMBEDDING_MODEL` (default `text-embedding-3-large`)
- `OPENAI_EMBEDDING_DIMENSIONS` (default `1536` — deve coincidir com a coluna `embedding` na BD)

## Fluxo dos workers

1. `download_worker` — baixa bytes, SHA-256, ficheiro temporário, enfileira `parse_chunk_worker`.
2. `parse_chunk_worker` — PDF → texto → `chunk_mtg_hierarchical` → insert documento/versão/chunks → backlinks de `parent_chunk_id` → enfileira `embed_worker`.
3. `embed_worker` — batches OpenAI → `UPDATE chunks SET embedding = ...`.
4. `reindex_worker` — stub (preparado para reprocessamento).

## Ingestão manual (sem fila)

```bash
cd services/api
pip install -e ../ingestion
pip install -r requirements.txt
python ../../scripts/ingest_mtg.py --game mtg --url "https://..."
```

## Testes

```bash
cd services/api
python -m ruff check app tests
python -m pytest -q
```

Testes cobrem chunker hierárquico, RRF e componentes isolados. Testes E2E completos (Postgres + Redis + OpenAI) exigem ambiente e chaves configurados.

## Próximos passos sugeridos

- Índice ANN (HNSW/IVFFlat) após carga significativa.
- Deduplicação de `document_versions` por `content_hash`.
- Reranker real (BGE) por trás da interface em `app/retrieval/rerank.py`.
