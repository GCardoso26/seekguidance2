# Plataforma de reconciliação de runtime e replay

Este documento descreve a camada **operacional** de reconciliação entre runtime híbrido (mobile, offline, edge), **replay persistente** e **lineage** temporal, sem alterar os contratos `reasoning_v1`…`reasoning_v11` nem os pipelines V1–V11.

## Objetivos

- **Replay merge real**: mesclagem assistida de ramos e snapshots com notas explicáveis (`reconciliation_notes`, `replay_consensus_summary`).
- **Alinhamento cross-device**: stubs em `app/runtime/replay_governance_v2/` (`cross_device_replay_merge`, `replay_lineage_alignment`, `replay_temporal_reconciliation`) como pontos de extensão determinísticos.
- **Verificação e reparo**: `replay_state_verification`, `deterministic_replay_hashing`, `runtime_replay_repair` — governança antes de relaxar invariantes.

## Limitações honestas

- Os módulos atuais são **stubs** orientados a contrato; integração com armazenamento durável e filas reais fica fora do núcleo de reasoning.
- Conflitos semânticos entre TCGs continuam resolvidos por **soft normalization**; não há equivalência forte entre jogos.

## Próximos passos reais

- Ligar `distributed_replay_reconciliation` a um journal WAL e a políticas de retenção em `persistent_replay_storage`.
- Publicar métricas de `replay_confidence` e `deterministic_repair_hints` para dashboards em `infra/observability/vnext/`.
