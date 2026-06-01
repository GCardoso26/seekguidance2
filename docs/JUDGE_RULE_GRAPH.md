# Judge — Rule graph automático

## Job

```bash
cd services/api
python -m jobs.rule_graph_builder --game mtg --dsn "$DATABASE_URL"
```

## Relações

- `references`, `supersedes`, `exception_to`, `example_of`

Metadado `confidence` em `rule_graph_edges.metadata`.

## Retrieval

Edges com `confidence` abaixo de `RULE_GRAPH_MIN_EDGE_CONFIDENCE` (default 0.45) são ignorados no grafo.

## Errata

Detecção heurística de texto de errata gera aresta `supersedes`.
