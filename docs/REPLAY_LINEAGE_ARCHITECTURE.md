# Arquitetura de lineage de replay

## Fluxo incremental

1. Snapshots versionados e `replay_refs` propagam-se por repositórios persistentes (stubs).
2. Lineage temporal liga slices a ramos e merges cross-device assistidos.
3. Observabilidade (`runtime_exporters`, dashboards Grafana JSON em `infra/observability/vnext/dashboards/`) expõe métricas agregadas PII-free.

## Compatibilidade

- Pipelines V1–V11 e contratos `reasoning_v*` permanecem no núcleo; lineage opera na camada operacional.
