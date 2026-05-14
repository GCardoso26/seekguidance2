# Worker Orchestration Runtime

## Componentes

- **DLQ:** `services/workers/dlq_store.py` — Redis opcional + fallback in-memory; `poison_message_heuristic`.
- **Orquestração:** `services/workers/orchestration_runtime.py` — `QueueSpec`, `queue_starvation_hint`, `worker_heartbeat_ok`.
- **Perfis de fila:** `services/workers/queue_profiles.py` (existente).

## Config

- `worker_dlq_redis_key_prefix` (Settings) — prefixo chave Redis.
- `ingestion_dlq_enabled` — já existente.

## Riscos operacionais

- DLQ em memória **não** sobrevive a restart — produção deve usar Redis/AOF.
- Starvation se prioridades estáticas favorecerem sempre ingestão.

## Limitações

- Autoscaling hooks ainda externos (KEDA/HPA).

## Próximos passos

1. Ligar `DlqStore` ao cliente Redis real nos workers arq.
2. UI de replay de DLQ (hooks descritos em `JUDGE_WORKSTATION_UX.md`).
