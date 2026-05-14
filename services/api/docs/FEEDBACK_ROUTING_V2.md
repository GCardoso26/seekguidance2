# Feedback loop de qualidade do grafo + Intent Routing V2

## Resumo

Esta sprint adiciona **infraestrutura de raciocínio adaptativo** em cima do retrieval existente:

1. **Persistência** (`tcg_judge.retrieval_feedback`, `tcg_judge.rule_graph_edge_quality`) — ver `infra/db/04_retrieval_feedback.sql` e `init.sql`.
2. **Feedback loop** (`app/graph/feedback/`) — sinais por query, reforço de arestas, heurísticas de drift, saúde do grafo.
3. **Routing V2** (`app/query_understanding/routing_v2/`) — perfis por intenção + templates de grafo de leitura.
4. **Multi-TCG** (`app/games/`) — `GameSemanticPack` em `types.py` + `registry` + pastas por jogo (stubs extensíveis).
5. **Pipeline** — `game_slug`, pesos híbridos dinâmicos, limite de expansão com **EMA de qualidade**, traço de arestas, `explainability` v2.
6. **API** — `ChatResponse.explainability` quando `explain_retrieval=true`.

## Fórmula `relationship_score_v2` (código)

Implementada em `edge_reinforcement.relationship_score_v2` como composição explícita de boosts/penalizações (além do score base em metadata da aresta).

## P2P / Docker

`docker-compose.yml` monta `04_retrieval_feedback.sql` no Postgres de desenvolvimento.

## Testes

- `tests/feedback/` — loop, reforço, drift, router, saúde, expansão.
- E2E (`RUN_E2E=1`): replacement↔SBA, priority↔triggers, damage/stack histórico.

## Gaps

- Reforço de arestas ainda **heurístico** (sem rotulagem humana).
- EMA é média simples dos últimos N registos (não EWMA verdadeira).
- Workers Redis podem consumir filas de feedback assíncrono (não implementado).
- Multi-TCG: ontologias são placeholders até haver ingestão por jogo.
