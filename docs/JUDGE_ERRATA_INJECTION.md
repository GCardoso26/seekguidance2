# Errata Injection (Wave 2A)

## Fluxo

Após rerank, `inject_errata()` em `retrieval/errata_injection.py`:

1. Para cada chunk com `rule_path`
2. Busca aresta `supersedes` em `rule_graph_edges`
3. Substitui chunk pela errata mais recente
4. Marca `source_type=errata` e `errata_supersedes`

## Frontend

SourceCard exibe badge âmbar "Errata" via `source_type`.

## Threshold

`EDGE_CONFIDENCE_THRESHOLD` filtra arestas de baixa confiança.
