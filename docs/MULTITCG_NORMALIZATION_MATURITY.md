# Multi-TCG Normalization Maturity

## Estado atual

- Normalização por slug, adaptadores por jogo (`app/games/adapters/*`).
- Taxonomias: timing, interação, ontologia, alinhamento cross-game (`app/games/normalization/*`).

## Novidades (sprint)

- `gameplay_maturity.py`: `timing_model_divergence`, `gameplay_equivalence_confidence` (heurísticas explícitas de **não**-equivalência mecânica).

## Corpus-aware ontology

- Ingestão: `parsing/formal_router.py` + `deep_semantics` alimentam `structured_rule_draft_v5`.
- Próximo passo: minerar relações para `rule_graph_edges` com confiança calibrada.

## Contratos

- `normalize_game_slug` e packs por jogo **inalterados** na semântica pública.

## Riscos multi-TCG

- **Leakage semântico**: misturar ontologias — mitigar com `rag_allowed_game_slugs` + validação `cross_tcg`.
- **Falsa equivalência** entre stack e chain.

## Gaps

- Perfis de “maturidade” por jogo (tabelas de scoring) ainda não materializados em DB.

## Próximos passos

1. Persistir matriz de maturidade por `game_slug` (versão, cobertura de parsers, cobertura de corpus).
2. Expandir testes `tests/semantic_intelligence/test_cross_tcg_semantics.py` com casos adversariais novos.
