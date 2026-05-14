# Runtime operations

Orquestração de workers, DLQ persistente e políticas de degradação alinhadas ao **judge assistant** (não motor jurídico).

## Itens planejados

- Filas idempotentes com poison-message handling
- Retenção de replay e snapshots semânticos (ver `infra/replay_storage`, `infra/semantic_storage`)
- SLOs de latência para pipelines `reasoning_v1`…`reasoning_v11` sem remoção de compatibilidade
