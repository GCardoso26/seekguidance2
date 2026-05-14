# Cross-TCG Pressure Hardening

## Princípio

**Soft normalization** apenas — `pressure_semantics.py` por jogo descreve pressão mecânica local **sem** equivalência forte com outros TCGs.

## Adaptadores

| Jogo | Módulo |
|------|--------|
| Yu-Gi-Oh | `app/games/adapters/yugioh/pressure_semantics.py` |
| FAB | `app/games/adapters/fab/pressure_semantics.py` |
| Pokémon | `app/games/adapters/pokemon/pressure_semantics.py` |
| One Piece | `app/games/adapters/onepiece/pressure_semantics.py` |
| Digimon | `app/games/adapters/digimon/pressure_semantics.py` |
| Lorcana | `app/games/adapters/lorcana/pressure_semantics.py` |
| Riftbound | `app/games/adapters/riftbound/pressure_semantics.py` |

## Estabilidade

- `app/stability/cross_runtime.py` — `cross_tcg_reasoning_stability` explicita isolamento soft.

## Riscos multi-TCG

- Leakage de ontologia se `rag_allowed_game_slugs` for demasiado permissivo sem filtros de retrieval.
- Falsa confiança se penalties de `cross_tcg` não forem aplicados em `operational_confidence_bundle`.

## Próximos passos

1. Ligar `pressure_semantics` a sinais de parser ingeridos (`tcg_dimensions`).
2. Testes de pressão com casos reais da `canonical_suite`.
