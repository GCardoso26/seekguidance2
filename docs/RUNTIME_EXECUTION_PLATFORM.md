# Plataforma de execução runtime (datasets + replay)

## Escopo

- `evaluation/runtime_execution/`: runners incrementais que aceitam `replay_refs`, `lineage` e `snapshots`, devolvendo notas ao juiz, raciocínio de legalidade/replay, alinhamento determinístico, confiança e resumos de contradição/estabilidade.
- Integração pretendida com `judge_grade_datasets_v4` e `executable_datasets` sem alterar `reasoning_v1…v11`.

## Limitações

- Sem motor jurídico automático: outputs são **assistentes** explainability-first.
- Sem DB pesado: execução local/CI usa stubs e contratos estáveis.

## Próximos passos

- Ligar cada runner a manifests JSON reais e a hashes de replay verificáveis.
