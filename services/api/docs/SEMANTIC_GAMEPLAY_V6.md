# Semantic gameplay object model + causal V6

## Visão geral

- **Objetos** (`semantic_objects/`): `GameplayObject`, `ObjectRegistry`, identidade/linhagem, zonas, modificadores, efeitos contínuos.
- **Causal** (`causal/`): grafo e cadeia causal a partir de papéis; deteção de ciclo em dependências.
- **Eventos** (`events/`): filas bounded, dispatcher, eventos atrasados.
- **Contínuos / layers** (`continuous/`): ordenação por subcamada + timestamp; dependências.
- **Equivalência** (`equivalence/`): normalização + hash semântico + fusão de caminhos equivalentes.
- **Snapshots** (`snapshots/`): histórico linear com cap.
- **Conflitos semânticos** (`semantic_conflicts/`): timestamps em colisão + ciclos de dependência.
- **Parser V2** (`rules/rule_parser_v2.py`): metadados extras para layers/contínuos/replacement.
- **Pipeline** (`semantic_v6_pipeline.py`): agrega tudo em `SemanticGameplayResolutionV6`.
- **API**: `reasoning_v6` espelha `semantic_resolution_v6`.

## Limites (performance)

- Filas: `EventQueue` ≤48, `DelayedEventQueue` ≤16, `TransitionHistory` ≤64, `ObjectRegistry` ≤32 objetos.
- Resolução de layers: número fixo de bindings no pipeline demonstrativo.

## Gaps

- Objetos não persistem ainda através de **todas** as transformações de zona do CR.
- Event dispatcher não interpreta todos os tipos de evento do CR.
- Parser V2 é **keyword/path-based**, não AST completa.
