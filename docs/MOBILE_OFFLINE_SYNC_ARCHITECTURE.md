# Arquitectura offline → online (sync incremental real — fase de contratos)

## Camadas

1. **Fila durável** — `offline_sync_queue_stub`, `sync_retry_runtime_stub`, `sync_backpressure_runtime_stub`.
2. **Delta** — `delta_sync_runtime_stub`, `replay_delta_transport_stub`, `incremental_replay_transport_stub`.
3. **Merge** — `snapshot_merge_runtime_stub`, `deterministic_sync_alignment_stub`, `offline_conflict_resolution_v2_stub`.
4. **Cross-device** — `cross_device_runtime_alignment_stub`.

## Campos de payload

- `sync_confidence`, `replay_delta_summary`, `conflict_resolution_notes`, `deterministic_merge_hints` (via `extras` / `offline_judge_payload`).
- Conflitos sensíveis: **assistente ao juiz**, sem auto-merge de ruling.

## Storage alinhado

Stubs em `app/mobile_runtime/sqlite_runtime/`, `replay_local_storage/`, etc., expõem `storage_status`, `integrity_status`, `replay_alignment`, `lineage_snapshot`, `offline_constraints` (via `attach_storage_operational_fields`).

## Próximos passos

1. Implementação real de fila (SQLite WAL + op_id idempotente).
2. Testes de propriedade em ordenação de merges.
