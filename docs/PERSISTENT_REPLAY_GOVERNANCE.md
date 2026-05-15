# Governança de replay persistente

## Componentes

- `app/runtime/persistent_replay_runtime/`: contratos `StorageDialect` + repositórios incrementais (snapshots, lineage temporal, diffs, arquivo de ramos, índice, reconciliação).
- `operational_bridge_stub`: mapa de ligação com `replay_governance_v2`, `production_runtime`, datasets e runtimes móvel/offline **sem** importações cíclicas pesadas.

## Armazenamento

- Backends previstos: sqlite, realm, filesystem, redis/postgres como placeholders — apenas contratos e stubs.

## Princípios

- Replay determinístico, lineage temporal e soft normalization preservados.
