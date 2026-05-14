# Motor de relações semânticas entre regras (TCG)

## Visão geral

O sistema evoluiu de **vizinhança numérica + `rule_graph_edges` estáticas** para um **pipeline híbrido de inferência** com módulos dedicados em `app/graph/relationship_extraction/`:

| Ficheiro | Função |
|----------|--------|
| `extractor.py` | Referências numéricas a regras (regex CR-style). |
| `citation_miner.py` | Sobreposição Jaccard entre conjuntos de referências. |
| `similarity.py` | Cosine similarity entre embeddings (pares offline / futuros). |
| `cooccurrence.py` | Pares de cabeçalhos em janelas deslizantes no mesmo documento. |
| `inference_engine.py` | Combinação pesada: `0.35*sem + 0.25*cit + 0.20*coo + 0.10*lex + 0.10*llm` + tipo heurístico. |
| `graph_store.py` | UPSERT em `tcg_judge.rule_graph_edges` com `metadata` JSON. |
| `llm_graph_builder.py` | Proposta de arestas via LLM (**offline**, JSON estrito). |
| `batch_offline.py` | Agregação por documento para job em lote. |

## Query decomposition

`app/query_understanding/decomposition.py` produz `QueryDecomposition` com `sub_queries`, `graph_seeds`, `lexical_augmentation` e `complexity`. O `RetrievalPipeline`:

- mistura a expansão lexical principal com `lexical_augmentation`;
- opcionalmente corre FTS extra nas primeiras sub-queries (`retrieval_decomposition_*` em `Settings`);
- injeta `graph_seeds` na expansão de grafo;
- calcula limite adaptativo com `app/graph/adaptive_expansion.py`.

## Expansão de grafo controlada

- `compute_graph_expansion_limit`: complexidade da pergunta, confiança do classificador, orçamento de tokens, intent.
- `dedupe_cap_heads` + `graph_max_seed_heads`: fan-out máximo.
- `fetch_graph_edges_extra_heads`: filtro opcional `metadata.relationship_score >= graph_edge_min_relationship_score`.

## Explicabilidade

- `app/retrieval/explanations.py` gera `retrieval_reasons` (lista curta, orientada a gameplay).
- `RetrievalOutcome` agrega hits, confiança, sinais, razões, decomposição e métricas de grafo.
- API: `explain_retrieval` em `ChatRequest`; `retrieval_reasons` em `ChatResponse`.

## Job offline

`scripts/offline_rule_graph_job.py` (raiz do repo): lê chunks com `rule_path`, gera arestas, opcionalmente enriquece com `--use-llm`. **Não** deve ser chamado no caminho do request.

## Testes

Pasta `tests/graph/` com cobertura unitária dos blocos acima. E2E (`RUN_E2E=1`) atualizado com três perguntas de gameplay.

## Gaps futuros

- Embeddings reais por par de regras no offline (hoje `batch_offline` usa semântica fixa moderada).
- Cache Redis para arestas quentes.
- Validação P2P completa com workers + ingestão ativa (depende do ambiente).
