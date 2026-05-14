# Symbolic state engine + structured rules + canonical suite

## Symbolic state (`app/reasoning/state_engine/`)

- `SymbolicGameState`: zonas como `frozenset` de tags, `flags` booleanos, `canonical_key()` para convergência.
- `state_transition_engine`: `initial_symbolic_state`, `apply_role_transition`, `evolve_along_roles` (bounded).
- `state_legality` / `transition_validator`: condições impossíveis e SBA com replacement pendente.
- `state_diff`: diferenças legíveis entre estados.

## Branching (`app/reasoning/branching/`)

- `generate_candidate_paths` + `prune_paths`: limite explícito de ramos e profundidade.
- `dead_path_detector`, `equivalence_merger`, `impossible_transition_filter`: extensível para scoring.

## State graph (`app/reasoning/state_graph/`)

- `build_state_graph`: nós + arestas de transição + marcadores de ilegalidade.

## Regras estruturadas (`app/rules/`)

- `StructuredRule` + `rule_parser` (incremental a partir de `rule_path` + excerpt).
- `rule_registry.get_structured_rules` combina hits + builtins (ex. `603.3b` MTG).

## Pipeline V5 (`symbolic_pipeline.py`)

Produz `SymbolicStateResolutionV5`: transições simbólicas, rejeições, `converged_paths`, legalidade, regras estruturadas, grafo.

## API

- `reasoning_v5` em `ChatResponse` (e `reasoning_v3["reasoning_v5"]` espelhado).
- Ativado com `include_reasoning_engine` (mesmo fluxo que v3/v4).

## Suite canónica

`evaluation/canonical_suite/**` — casos JSON para futuro runner de métricas (V3).

## Métricas (`app/evaluation/*_metrics.py`)

`state_legality_metrics`, `symbolic_consistency_metrics`, `transition_accuracy`, `convergence_metrics`, `branch_pruning_metrics`.

## Gaps

- Estados/zonas ainda **minimalistas** (não substituem CR nem engine de mesa).
- Parser de regra **heurístico** por prefixo numérico; falta ingestão estruturada (AST/JSON oficial).
- `symbolic_max_branch` global ainda não exposto em `Settings` (hardcoded 4).
