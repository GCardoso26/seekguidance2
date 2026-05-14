# Context assembly judge-grade

## Objetivo

Transformar **chunks recuperados** num **contexto LLM estruturado** (hierarquia, compressão legal conservadora, orçamento de tokens, routing por intenção, sinais temporais).

## Pipeline

1. **Query understanding** (`app/query_understanding/`): `classify_query` → `route_query` → `RetrievalHint` (`doc_types`, `lexical_query`, `prefer_historical`).
2. **Retrieval** (`RetrievalPipeline`): filtros `doc_type` no SQL + query lexical expandida; reordenação temporal opcional.
3. **Context assembly** (`app/context/`):
   - `hierarchy.py`: agrupa `parent` / `atomic` / `sibling`.
   - `compressor.py`: dedupe de linhas + corte preservando marcadores (`Exception`, `Note:`, …).
   - `summarizer.py`: envelopes `[PARENT|ATOMIC|SIBLING]` (sem paráfrase LLM).
   - `budgeting.py`: `tiktoken` + quotas por camada.
   - `assembler.py`: `ContextAssemblyEngine.assemble()` → `AssembledPrompt`.
4. **LLM** (`LlmComposer`): system + user com bloco estruturado e índice de citações.

## API

`ChatRequest` opcional:

- `prefer_historical`: força modo temporal.
- `as_of`: metadado para futura filtragem SQL por versão.

## Métricas (structlog)

`context.assembly.done` e `context.assembly.orchestrator`: `prompt_context_tokens_est`, `compression_redundancy_ratio`, `hierarchy_depth_max`, contagens por camada, `temporal_prefer_historical`, `intent`.

## Gaps

- Filtro SQL estrito por `as_of` / `document_versions.effective_from`.
- Router assistido por LLM (embeddings cross-encoder dedicado).
- Prunar blocos por prioridade em vez de compressão global ao exceder budget.
