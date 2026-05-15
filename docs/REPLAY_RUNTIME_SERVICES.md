# Serviços de replay runtime (wiring)

## Conteúdo

- `app/runtime/persistent_replay_runtime/`: serviços (`replay_runtime_service`, `replay_snapshot_manager`, `replay_lineage_service`, reconciliação, bridge, router de storage, integridade, alinhamento temporal, ramos, saúde) compostos sobre **repositórios existentes**, com payloads:
  - `replay_runtime_summary`, `lineage_runtime_summary`, `reconciliation_summary`, `replay_health_summary`, `deterministic_replay_alignment`.

## Regras

- Sem DB pesado; sem imports circulares; dialects existentes preservados.
