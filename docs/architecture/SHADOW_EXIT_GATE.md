# Scryfall SHADOW — exit gate (CANARY)

**Status:** Congelado — Sprint 2  
**Pré-requisito:** Database Certification + Contracts PG verdes

## Fluxo obrigatório

```text
Provider → Scheduler → Producer → BullMQ/JobQueue → Processor → Application Service
  → Repository + Outbox INSERT → COMMIT → Outbox Worker → Redis → Consumers
```

**Proibido:** EventBus.publish direto a partir do sync (débito CatalogSyncService eliminado).

## Incrementos

| Inc | Escopo |
|-----|--------|
| A | enqueue only (`SHADOW_PROCESS_JOBS=0`) |
| B | persist PG + Outbox insert (`SHADOW_PUBLISH=0`) |
| C | Outbox Worker → publish |
| D | Scryfall real + pipeline completo |

CLI: `npm run sync:scryfall:shadow [SET_CODE]`

## Critérios para sair do SHADOW → CANARY

Só avançar quando **todos** forem verdadeiros:

- [ ] ConsistencyValidator: **0** inconsistências duras (sem FK órfã / card sem set / mapping órfão)
- [ ] **0** eventos `dead` no Outbox do sync
- [ ] **0** jobs failed no JobQueue
- [ ] **0** provider HTTP errors críticos no sync
- [ ] Outbox lag P95 dentro do SLO (&lt; 30 s) após catch-up
- [ ] Sem eventos duplicados indevidos (consumer_offsets)
- [ ] Conjunto representativo (ex.: um set completo) sincronizado sem falha crítica
- [ ] Budgets: Persist Card &lt; 20 ms p50; Claim Outbox &lt; 1 s
- [ ] Métricas disponíveis: inserts/updates/unchanged, provider_latency_ms, cards_per_second, outbox_events_per_sync

`report.readyForCanary === true` no output do CLI é o sinal operacional interno (ainda requer revisão humana dos itens acima).

## Sprint 2.5 (obrigatória antes do CANARY)

Não sair do SHADOW só com o primeiro sync verde. Executar stress em [`SHADOW_STRESS.md`](./SHADOW_STRESS.md):

- Re-sync idempotente (creates → unchanged)
- Multi-set + FKs
- Lease reclaim
- Publisher outage
- Provider timeout + retry
- Sync concorrente

Observabilidade futura: [`SYNC_TIMELINE.md`](./SYNC_TIMELINE.md).

## Métricas SHADOW

inserts · updates · unchanged · provider_latency_ms · provider_http_errors · provider_rate_limit_hits · cards_per_second · events_per_card · outbox_events_per_sync · repository_upsert_total · processor/application timings
