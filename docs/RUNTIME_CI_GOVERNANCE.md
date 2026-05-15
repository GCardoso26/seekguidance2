# Governança de CI operacional (runtime_execution + gates)

## Objetivo

- `evaluation/runtime_ci/`: gates com `pass`, `confidence`, notas ao juiz, raciocínio de replay, resumo de regressão, consciência de lineage e drift.
- Ligação incremental com `evaluation/runtime_execution/` e manifests em `judge_grade_datasets_v4` / `executable_datasets`.

## Princípios

- Sem motor jurídico automático; explainability-first; soft normalization obrigatório.

## Limitações

- Stubs operacionais; integração com CI real (GitHub Actions) evolui por fases.
