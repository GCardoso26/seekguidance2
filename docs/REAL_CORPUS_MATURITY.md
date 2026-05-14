# Real Corpus Maturity

## Objetivo

Elevar o corpus de “MVP indexado” para um **fluxo contínuo publisher-grade**, alimentando retrieval, grafo semântico, temporal reasoning e ontologia — **sem** alterar pipelines de reasoning V1–V11 na API.

## Arquitetura (incremental)

| Componente | Localização | Função |
|--------------|-------------|--------|
| Crawlers reais multi-TCG | `services/ingestion/tcg_judge_ingestion/crawlers_real/{mtg,yugioh,...}/` | Catálogo de fontes, intenção de crawl, policy/rulings/errata, diff e versões históricas (stubs extensíveis). |
| Registry | `crawlers_real/registry.py` | Lista de jogos suportados. |
| Corpus temporal | `corpus/temporal_persistence.py` | `effective_from` / `effective_to`, `supersedes` / `superseded_by`, `semantic_hash`, `ontology_lineage_id`. |
| Parsing formal | `parsing/formal_router.py` | Camada sobre `parsers/` com `formal_slots` (timing, precedência, replacement, stack/chain, torneio). |
| Validação real | `validation_real/metrics.py` | Cobertura semântica, lineage órfão, confiança de parser (heurísticas). |
| Corpus existente | `corpus/*`, `trust/*`, `parsers/deep_semantics.py` | Trust scoring, `structured_rule_draft_v5`, alinhamento. |

## Integrações

- **Resilient fetch / robots / throttle**: continua em `tcg_judge_ingestion/crawler/`; `crawlers_real` prepara entradas e metadados para orquestrar downloads.
- **Semantic diffing**: `document_diffing.py` por jogo delega futuramente a `semantic_diffing/sections.py`.
- **Workers**: filas descritas em `services/workers/queue_profiles.py` + `gpu_inference_hooks.py`.

## Contratos

- Nenhuma alteração a `ChatResponse` / `reasoning_v*`.
- Ingestão permanece pacote separado importado em testes via `tests/conftest.py`.

## Gaps honestos

- URLs reais e credenciais publisher-specific ainda **não** ligadas por jogo (catálogos usam `url_template: null`).
- Snapshotting imutável em armazenamento objeto (S3/Blob) **não** implementado.
- `validation_real` ainda não persiste resultados em Postgres.

## Riscos

- **Legal/compliance**: respeitar `robots.txt`, termos de uso e rate limits por publisher.
- **Drift de fonte**: errata frequente exige `semantic_hash` + diff contínuo.

## Próximos passos

1. Preencher `source_catalog.py` por jogo com URLs canónicas e prioridades.
2. Persistir `CorpusTemporalEdge` em tabelas de lineage (migração dedicada).
3. Ligar `crawl_intent` a workers arq com DLQ e métricas OTEL.

## Custos

- Armazenamento de PDFs + snapshots versionados.
- Embeddings recompute ao mudar modelo (ver `app/retrieval/hnsw_ops.py`).
