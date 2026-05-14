# Relatório técnico — retrieval temporal, grafo e montagem de contexto

## Escopo desta entrega

Extensão incremental do pipeline existente (SQL híbrido → expansão → dedup → rerank → orquestrador) com:

- **Filtro temporal real** já aplicado em `search_vector_hits` / `search_lexical_hits` via `temporal_sql_filter` (`as_of` + janela `effective_from` / `effective_to` em `document_versions`).
- **Scoring temporal pós-fetch** (`compute_temporal_score`) e **score composto** (`composite_retrieval_score`) integrados no `RetrievalPipeline` (ordenação do pool, entrada do rerank, ordenação final com desempate por versão quando histórico / snapshot).
- **Expansão por grafo** (`expand_hits_with_graph`) após dedup inicial: merge de chunks vizinhos + segundo dedup por embedding; bonus configurável em `fused_score`; métrica `graph_expansion_candidates` nos logs.
- **Montagem de contexto**: blocos rastreáveis (`PromptBlock` + `trace_blocks` em `AssembledPrompt`), **pruning por prioridade** (`_pack_blocks_by_priority`) antes da compressão global; métricas de pruning e média de score temporal.
- **Configuração**: novos campos em `Settings` e variáveis em `.env.example` (pesos compostos, pesos temporais, limites do grafo).

## Módulos principais

| Área | Ficheiros |
|------|-----------|
| SQL temporal | `app/retrieval/temporal_sql.py`, `app/retrieval/sql_retrieval.py` |
| Scoring | `app/retrieval/temporal_scoring.py` |
| Pipeline | `app/retrieval/pipeline.py`, `app/retrieval/hybrid.py` (wrapper) |
| Grafo | `app/graph/*` |
| Contexto / trace | `app/context/prompt_blocks.py`, `app/context/assembler.py` |
| Orquestração | `app/application/rag_orchestrator.py` |
| Config | `app/core/config.py`, `.env.example` |

## Migrações / schema

Mantêm-se as migrações já previstas no projeto para `document_versions` (janelas de vigência) e `rule_graph_edges` (relações persistidas), montadas no fluxo Docker/init conforme documentação do repositório.

## Observabilidade (logs estruturados)

- **Retrieval** (`retrieval.pipeline.done`): `temporal_prefer_historical`, `temporal_as_of_set`, `temporal_sql_active`, `temporal_score_mean`, `graph_expansion_candidates`, `latency_ms_graph`, latências existentes.
- **Contexto** (`context.assembly.done`): `temporal_score_mean`, `pruning_blocks_*`, `pruning_est_tokens_dropped`, `trace_block_count`, `temporal_as_of_set`.

## Testes executados

- `python -m pytest tests/ -q` — **31 passed**, **3 skipped** (E2E marcados com `RUN_E2E=1`).
- `python -m ruff check app tests` — sem erros após correção de imports.

Novos testes unitários: `tests/test_temporal_and_graph_unit.py` (SQL temporal, scoring, vizinhança semântica). E2E atualizado em `tests/e2e/test_judge_questions.py` com as três perguntas obrigatórias da sprint (legend histórica, replacement vs SBA, priority vs triggered).

## Problemas corrigidos nesta continuação

- `Settings` alinhado com `temporal_scoring` (pesos e grafo).
- Integração completa `TemporalHint` → SQL + scoring + `HybridRetriever.search(..., temporal=...)`.
- Remoção de import não usado em `graph_builder.py`.
- Ajustes Ruff (I001, E501).

## Gaps e próximos passos recomendados

1. **P2P / E2E com API real**: correr `RUN_E2E=1` contra instância com Postgres preenchido (ingestão + embeddings) para validar grounding nas três perguntas.
2. **Popular `rule_graph_edges`** com relações curadas (replacement ↔ SBA ↔ priority) para o grafo ir além da vizinhança numérica + `RULE_NEIGHBOR_HEADS`.
3. **Métricas agregadas** (Prometheus/OpenTelemetry): taxas temporais, profundidade média de expansão, ratio de pruning — hoje estão em logs structlog.
4. **`effective_score` em `ChunkHit`**: opcionalmente alinhar a propriedade ao score composto quando útil para UI; hoje o composto governa ordenação no pipeline e no rerank pool.
5. **Testes de integração Postgres**: estender `tests/integration/test_retrieval_pg.py` para `as_of` e expansão de grafo com dados mínimos de seed.

## Nota de produto

Tom do system supplement e das notas temporais orientado a **explicação de gameplay e regras**, evitando linguagem de “plataforma jurídica”, mantendo auditabilidade via `trace_blocks` e índice de citações.
