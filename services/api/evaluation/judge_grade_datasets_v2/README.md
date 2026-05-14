# Judge-grade datasets v2

Manifestos de avaliação **explainability-first** para o assistente de regras: referenciam replays, lineage temporal e expectativas determinísticas **sem** expor encodings internos (CNF/SAT).

## Layout

- `schemas/` — JSON Schema dos manifestos e metadados de lineage.
- `manifests/` — exemplos de dataset (expandir com corpus real).
- `lineage/` — exemplos de supersession / policy delta (stubs).

## Multi-TCG

Cada entrada declara `game_slug` (`mtg`, `yugioh`, `pokemon`, `onepiece`, `digimon`, `fab`, `lorcana`, `riftbound`). **Sem** equivalência forte entre jogos.

## Campos principais (manifest)

Ver `schemas/dataset_manifest.schema.json`: `legality_expectations`, `timing_expectations`, `deterministic_expectations`, `replay_refs`, `lineage_metadata`.
