# Governança de replay móvel (v2 + extensões)

## Escopo

Extensões em `app/runtime/replay_governance_v2/` para **alinhamento**, **reconciliação de snapshots**, **integridade offline**, **consistência cross-device**, **compactação v2**, **merge temporal**, **governança de ramos** e **custos** — todas **explainability-first** e **deterministic-first**.

## Relação com o núcleo

- **Não** substituem `replay_consistency_runtime`, `replay_storage_governance`, etc.
- **Complementam** o cenário **mobile/offline** com stubs que documentam payloads e políticas esperadas.

## Cross-device

`cross_device_replay_consistency_stub` descreve ordenação estável e limites de peers — **sem** colapsar identidades de jogadores nem impor equivalência entre TCGs.

## Gaps

- Prova formal de merge três-vias ainda **roadmap**; stubs guiam contratos de UI/SDK.
