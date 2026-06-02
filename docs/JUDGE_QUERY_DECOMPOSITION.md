# Query Decomposition (Wave 2A)

## Detecção

`MECHANIC_KEYWORDS` por jogo em `retrieval/query_decomposer.py`.

`should_decompose()` → true quando 2+ mecânicas na pergunta.

## Sub-queries

1. Uma por mecânica: "Como funciona {mech} em {game}?"
2. Pergunta original (interação)

## Integração

Pipeline (`pipeline.py`) faz buscas vetoriais paralelas e fusão RRF quando `QUERY_DECOMPOSITION_ENABLED=true`.

Desligado: comportamento idêntico ao path single-query.
