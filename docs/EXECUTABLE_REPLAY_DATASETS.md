# Datasets executáveis e replay

## Pipeline

- `evaluation/executable_datasets/`: casos por domínio (legalidade, timing, multiplayer, divergência de replay) mais stubs `dataset_*_runtime` para **drift**, **lineage**, **reconciliação** e **regressões**.
- `evaluation/judge_grade_datasets_v4/runtime_dataset_execution/`: ligação judge-grade entre **dataset** e **runtime** (stub).

## Objetivos

- Datasets **vivos**: atualizáveis com lineage e validação de replay.
- **CI determinístico**: mesmos inputs → mesmos hashes de verificação onde aplicável.
- **Cross-TCG safe**: expectativas por jogo, sem colapsar semânticas.

## Observabilidade

Métricas e traces devem referenciar `run_id` / `replay_id` compartilhados entre `app/observability/live_runtime/` e estes pacotes.

## Limitações

- Corpus real e fixtures pesadas ficam fora deste repositório; os stubs garantem **contrato** e imports estáveis.

## Próximos passos

- Preencher manifests reais e ligar `replay_dataset_execution` a jobs `continuous_v8`.
