# Retrieval judge-grade — relatório técnico

## Objetivo

Elevar o RAG MTG para **grounding hierárquico**, **híbrido denso + lexical configurável**, **deduplicação semântica**, **rerank BGE opcional**, **confiança baseada em sinais** e **citações auditáveis**.

## Mudanças principais

### Serviços (camadas explícitas)

| Módulo | Função |
|--------|--------|
| `app/retrieval/sql_retrieval.py` | Consultas vetoriais + FTS (`ts_rank_cd` como proxy lexical tipo BM25) |
| `app/retrieval/fusion.py` | Pesos `vector` / `lexical` + mistura opcional com RRF (`RETRIEVAL_RRF_BLEND`) |
| `app/retrieval/diversification.py` | Quotas por capítulo de regra (ex. `603`) e por documento |
| `app/retrieval/expansion.py` | CTE recursiva `parent_chunk_id` + siblings (mesmo pai) |
| `app/retrieval/deduplication.py` | Cosine similarity em embeddings já persistidos |
| `app/retrieval/rerank.py` | `BaseReranker`, `IdentityReranker`, `BGEReranker` (`BAAI/bge-reranker-large`), factory |
| `app/retrieval/pipeline.py` | `RetrievalPipeline.run()` — orquestra fases + métricas de latência em structlog |
| `app/retrieval/confidence.py` | `ConfidenceSignals` + `compute_confidence` (overlap vec/lex, fused, rerank, spread, fontes) |
| `app/retrieval/citation_service.py` | `citations_from_hits` — enriquecimento de `ChatCitation` |
| `app/retrieval/types.py` | `ChunkHit` com scores e proveniência (`expansion_source`) |
| `app/retrieval/hybrid.py` | Reexporta `HybridRetriever` / `RetrievalPipeline` (compat) |

### Configuração (`app/core/config.py`)

Novas variáveis de ambiente (prefixo implícito via pydantic): `RETRIEVAL_*`, `RERANKER_*`, `CONFIDENCE_LOW_THRESHOLD`.

### API / schemas

- `ChatCitation`: `rule_path`, `document_hash`, `chunk_content_sha256`, `retrieval_score`, `page_number` (metadata).
- `/v1/chat/ask`: confiança vem do pipeline + pequeno bónus de consistência de citações; disclaimer se abaixo do limiar.

### Dependências

- **Produção**: sem `sentence-transformers` por defeito (evita PyTorch pesado na CI).
- **Rerank**: `make install-rerank` ou `pip install sentence-transformers`; `RERANKER_ENABLED=true`.
- **Integração**: `requirements-dev.txt` (`psycopg`, `testcontainers`).

### Testes

- Unitários: `tests/test_judge_retrieval_unit.py`, `test_rrf.py` (importa `rrf_merge` de `fusion`).
- Integração (`@pytest.mark.integration`): Postgres `pgvector/pgvector:pg16` via testcontainers, `RUN_INTEGRATION=1`.
- E2E (`@pytest.mark.e2e`): `RUN_E2E=1`, `httpx` contra `E2E_API_BASE`.

### CI

`pytest -m "not integration and not e2e"` — integração e E2E manuais ou job separado.

### Makefile (raiz)

`make test`, `make integration-test`, `make lint`, `make ingest-mtg`, `make worker`, `make ask`, `make install-rerank`, etc.

## Comandos executados (validação)

```text
cd services/api
ruff check app tests
pytest -q -m "not integration and not e2e"
RUN_INTEGRATION=1 pytest -q tests/integration -m integration
```

## Problemas corrigidos durante a implementação

- Import circular `hybrid` ↔ `pipeline` resolvido com `sql_retrieval.py`.
- Diversificação: segunda fase violava quota por capítulo — corrigido para manter `max_per_chapter`.
- DSN testcontainers (`postgresql+psycopg2://`) incompatível com **psycopg v3** — normalização para `postgresql://`.
- `ChunkHit` / `HybridRetriever.search` passam a devolver `(hits, confidence, signals)` consumidos pelo orquestrador.

## Gaps / próximos passos

1. **BM25 “puro”**: hoje FTS `ts_rank_cd`; opcional Tantivy/pg_bm25 ou extensão dedicada.
2. **HNSW/IVFFlat** em produção após volume mínimo de chunks.
3. **Pré-carregar modelo BGE** na imagem Docker se `RERANKER_ENABLED=true` (tamanho/build time).
4. **E2E automatizado na CI** com compose + seed de embeddings (secret `OPENAI_API_KEY`).
5. **`page_number`**: popular na ingestão PDF (metadata) para preencher citações.
