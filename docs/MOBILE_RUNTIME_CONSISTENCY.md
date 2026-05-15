# Consistência runtime mobile-first

## Pacotes

- `app/mobile_runtime/runtime_sync_v2/`: merge de deltas, alinhamento determinístico, conflitos de sync, lineage móvel, diff de snapshots, compactação, entropia e reconciliação.
- Extensões em `app/mobile_security` (`replay_delta_trust_v2`) e `app/offline_runtime` (`offline_replay_lineage_v2`).

## Objetivo

- Replay e sync **explainability-first**, com hints de conflito e governança incremental, sem equivalência forte entre TCGs.
