# Plataforma de runtime edge/mobile (híbrido operacional)

## Visão

O **edge runtime** (`app/edge_runtime/`) complementa `app/mobile_runtime/` e `app/offline_runtime/`: execução **local leve**, **replay compacto**, **sync incremental** e **governança de custo**, sem substituir o núcleo cloud nem os contratos **reasoning_v1…reasoning_v11**.

## Componentes

| Área | Módulo (stub) | Função operacional |
|------|-----------------|---------------------|
| Reasoning limitado | `edge_reasoning_runtime` | Hints; servidor mantém pipelines V1–V11 |
| Replay | `edge_replay_runtime` | Chunks lazy + resume determinístico |
| Sync | `edge_sync_runtime` | Delta + backpressure cooperativo |
| Temporal | `edge_temporal_runtime` | Soft normalization; sem equivalência forte cross-TCG |
| Dataset | `edge_dataset_runtime` | Subconjuntos executáveis com manifesto |
| Limites | `edge_runtime_limits` | RAM/CPU/bateria |
| Saúde | `edge_runtime_health` | Fail-safe read-only quando degradado |
| Observabilidade | `edge_runtime_observability` | Ring buffer; export opcional |

Campos transversais nos stubs: `edge_constraints`, `replay_compaction`, `deterministic_limits`, `sync_expectations`.

## Limitações honestas

- Persistência física (SQLite/Realm) continua a ser **ligada** aos stubs de storage em `app/mobile_runtime/*_runtime/` — implementação binária por plataforma fica no cliente RN/Flutter.
- **Explosion control v6** (`app/runtime/explosion_control_v6/`) evolui caps **sem** remover **v5**.

## Próximos passos

1. Ligar edge stubs a métricas `app/observability/live_runtime/mobile_edge_metrics.py`.
2. Contract tests OpenAPI ↔ TypeScript em `apps/mobile/shared_contracts/typescript_contracts/`.
