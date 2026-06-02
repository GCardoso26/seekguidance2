# Rule Graph (Wave 2A)

## Auto-geração

Job `services/api/jobs/rule_graph_builder.py` extrai arestas via regex após ingestão.

Tipos: `references`, `supersedes`, `exception_to`, `example_of`

Metadados em `rule_graph_edges.metadata`:
- `confidence` (0–1)
- `source`: `auto_generated` | `manual`
- `extracted_text`

## Ciclos

Aresta A→B rejeitada se B→A já existe. Contador `cycles_prevented` no sumário do job.

## Retrieval

`expand_chunks_via_graph()` em `graph_retrieval.py` usa visited set + `RULE_GRAPH_MAX_DEPTH`.

Filtro: `EDGE_CONFIDENCE_THRESHOLD` (default 0.70).
