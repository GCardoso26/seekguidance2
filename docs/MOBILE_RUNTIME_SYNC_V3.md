# Mobile runtime sync v3

## Novos módulos

- `runtime_sync_v2/`: filas de delta, scheduler, lineage de snapshot, classificador de conflitos, replay determinístico móvel, governança v2, saúde de sync, custos, compactação.
- `offline_runtime/offline_replay_reconciliation.py`
- `mobile_security/replay_sync_observability_v3.py`

## Objetivo

- Sync incremental estável, merge assistido e observabilidade PII-free.
