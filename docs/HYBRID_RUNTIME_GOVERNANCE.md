# Governança de runtime híbrido (v3)

## Escopo

Módulos em `app/runtime/production_runtime/` cobrem **quorum**, **snapshots**, **failover**, **custos** e **previsão de estabilidade** — sempre com viés **explainability-first** e **replay-first**.

## Princípios

- **Quorum determinístico**: decisões auditáveis; sem “voto opaco” que substitua explicação ao juiz.
- **Degradação governada**: limites operacionais antes de silent drop de eventos.
- **Cross-device**: alinhamento de snapshot sem forçar equivalência forte entre TCGs.

## Integração CI

`app/evaluation/continuous_v8/` expõe gates `*_runtime_ci` para regressão temporal, drift, lineage e governança de replay, em paralelo aos datasets executáveis.

## Limitações

- Stubs não executam políticas reais de custo; definem o contrato para orquestração externa.

## Próximos passos

- Mapear cada gate CI a um dataset vivo em `evaluation/executable_datasets/` e a um painel Grafana.
