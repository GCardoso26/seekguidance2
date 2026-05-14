# Persistência operacional do judge runtime

## Visão

Pacotes `persistent_*` sob `app/mobile_runtime/`, `app/offline_runtime/` e `app/edge_runtime/` modelam **snapshots**, **replay incremental persistido**, **lineage** e **recuperação determinística**, alinhados ao payload móvel (`attach_persistent_operational_fields`).

## Campos operacionais

- `persistent_status`: saúde do armazenamento e journals.
- `storage_recovery`: checkpoints e retomada segura.
- `replay_reconciliation`: fila e alinhamento de merges.
- `lineage_persistence`: âncoras temporais ligadas ao replay.
- `deterministic_recovery_alignment`: token de retomada para CI e dispositivos.

## Recovery-safe e compactação

`persistent_runtime_compaction` e `persistent_runtime_recovery` são os pontos de extensão para **pruning** de replay com política de retenção explícita (documentada no operador, não escondida no modelo).

## Limitações

- Sem substituir o motor incremental do core: a persistência **envolve** o reasoning, não o duplica.

## Próximos passos

- Implementar backends concretos (SQLite, blob sync) por runtime, mantendo o mesmo contrato de payload.
