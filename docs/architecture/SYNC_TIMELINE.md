# Sync Timeline (observabilidade)

**Status:** Spec — Sprint 2.5+  
**Escopo:** visualização única do pipeline Catalog Sync. **Não** é feature de produto.

## Objetivo

Quando houver lag, retries ou queda de throughput, responder em segundos: *qual estágio* está lento.

## Cadeia

```text
Sync → Job → Card → Repository → Commit → Outbox → Publish → Consumer → Projection
```

## Tempos por estágio (exemplo)

| Estágio | Métrica sugerida |
|---------|------------------|
| Scheduler | `scheduler_enqueue_ms` |
| Processor | `processor_time_ms` (já no Shadow report) |
| Application | `application_time_ms` |
| Repository | `repository_time_ms` / Persist Card p50 |
| Commit | tx duration |
| Outbox insert | incluso no AS tx |
| Publisher | `publishTimeMs` / `outbox_publish_duration_seconds` |
| Search consumer | (Sprint 3) `search_consume_ms` |
| Projection | (Sprint 3) `search_index_ms` |

## Fonte de dados

- ShadowSyncReport (por sync)
- `platform.outbox_events` (lag, attempts, dead)
- JobEnvelope / BullMQ (quando em Redis)
- Metrics registry (`cards_per_second`, `outbox_backlog`, …)

## UI

Dashboard único **Sync Timeline**: uma corrida vertical (ou waterfall) por `requestId`/`correlationId`, com timestamps absolutos e deltas.

**Fora de escopo agora:** implementação frontend. Spec congelada para Sprint 3/6 (ops).
