# Foundation Freeze — v0.2.0-foundation

**Tag:** `v0.2.0-foundation`  
**Data:** 2026-07-16  
**Status:** Base definitiva para Outbox (docs v1.2.4) — código da tag intacto  
**Escopo:** Etapa 2 / Fase 1 (fundação) + contrato Outbox definitivo

---

## 1. Revisão rápida de dependências entre domínios

### Cadeia permitida

```text
Catalog → Pricing → Marketplace → Search → Analytics
         ↘ Media ↗
Platform / shared  →  todos (transversal)
workers/           →  composition root (pode importar qualquer domínio)
```

### Matriz verificada no código (`services/api/src`)

| Módulo | Importa | Avaliação |
|--------|---------|-----------|
| `catalog/` | `platform`, `shared`, interno | OK |
| `pricing/` | só interfaces próprias | OK — sem Catalog/Marketplace |
| `media/` | `platform`, `shared` | OK |
| `marketplace/` | nenhum outro domínio | OK (RenderedCard self-contained) |
| `search/` | `platform`, `shared` | OK — não importa Catalog |
| `analytics/` | `platform`, `shared` | OK |
| `platform/` | `shared` (tipos de evento) | OK |
| `shared/` | nenhum domínio | OK |
| `workers/` | catalog, analytics, search, platform | OK — entrypoint |

### Débitos aceitos no freeze (código da tag)

| Item | Severidade | Nota |
|------|------------|------|
| `CatalogSyncService` publica direto no Event Bus | Alto | Substituir no incremento Outbox |
| Testes de fundação cruzam domínios | Baixo | Smoke aceitável |

---

## 2. Contratos públicos

### 2.1 Event Envelope (definitivo)

```ts
{
  eventType: DomainEventName;
  eventVersion: number;       // SEMÂNTICA do evento
  schemaVersion: number;      // FORMATO do payload
  aggregateType: string;
  aggregateId: string;
  occurredAt: string;
  requestId: string;
  traceId?: string;
  correlationId: string;      // mesma jornada/sync
  causationId?: string;       // evento que causou este
  projectionVersion?: string; // ex.: cards_v1
  payload: Record<string, unknown>;
}
```

| Campo | Quando muda |
|-------|-------------|
| `eventVersion` | Semântica muda (breaking para consumidores) |
| `schemaVersion` | Só o formato serializado do payload muda |

### 2.2 Domain Events (eventType)

`CardUpdated` · `SetUpdated` · `VariantUpdated` · `MediaUpdated` · `PriceUpdated` · `CurrencyUpdated` · `MarketplaceListingUpdated` · `ProviderHealthChanged`

### 2.3–2.9

CatalogProvider · PricingProvider · Provider Registry (cost/availability/success_rate) · Feature Flags · DTOs · Filas BullMQ · Media/RenderedCard — inalterados em espírito (ver tag + commits 1.2.x).

### 2.10 Schemas Fase 1

Migration tag: `20260723120000_domain_schemas_phase1.sql`  
Novas tabelas Outbox/offsets = **migrations novas**.

---

## 3. Fluxo transacional canônico

```text
Request
  → TransactionManager.begin()
  → Repositories (upserts)
  → OutboxRepository.insert (payload IMUTÁVEL)
  → COMMIT
  → Outbox Publisher (lease + SKIP LOCKED)
  → EventPublisher (port) → RedisPublisher (adapter)
  → Consumers (+ consumer_offsets)
```

**Proibido:** publish antes do commit.  
**Proibido:** `UPDATE` do `payload` no Outbox — correção = novo evento.

---

## 4. Outbox — leasing + DLQ + imutabilidade

### 4.1 Tabela `platform.outbox_events`

```text
id, aggregate_type, aggregate_id
event_name, event_version, schema_version
payload jsonb              -- IMUTÁVEL após INSERT
status                     -- pending | leased | published | dead
attempts, max_attempts
next_retry_at
lease_until, leased_by     -- leasing
published_at, created_at
request_id, trace_id
correlation_id, causation_id
projection_version
last_error
```

### 4.2 Leasing

```text
SELECT … FOR UPDATE SKIP LOCKED
  WHERE status = 'pending'
     OR (status = 'leased' AND lease_until < now())
→ status=leased, leased_by, lease_until
→ EventPublisher.publish(exact payload)
→ status=published
```

Worker morto → outro recupera após expirar o lease.

### 4.3 DLQ (`status = dead`)

```text
pending → leased → falha → retry… → (attempts >= max_attempts) → dead
```

Reprocessamento ops: `dead → pending` sem alterar payload.

### 4.4 EventPublisher (desacoplado de Redis)

```text
EventPublisher (interface)
  └── RedisPublisher (default)
  └── KafkaPublisher | NatsPublisher | RabbitPublisher (futuro)
```

### 4.5 Snapshot

O que está no Outbox é **exatamente** o que se publica. Sem mutação posterior.

---

## 5. Consumer offsets (+ métricas)

`platform.consumer_offsets`:

```text
consumer_name, event_id (PK)
processed_at
processing_duration_ms
result          -- success | skipped | failed
last_error
```

---

## 6. Ordem de construção

```text
1 Outbox (schema + lease + DLQ + OutboxRepository + EventPublisher + RedisPublisher + worker)
2 TransactionManager
3 Repository ports + Postgres* adapters
4 BullMQ processors
5 Persistência real
6–8 Scryfall OFF → SHADOW → CANARY → LIVE
9+ Providers → Media → Pricing → Search → Analytics
```

Índices `provider_mappings`: `(provider, provider_card_id)`, `(provider, provider_variant_id)`, `(catalog_card_id)`, `(catalog_variant_id)`.  
Pricing: `current_price_snapshot` + `price_history`.

---

## 7. Checklist operacional (pré Fase 3 Media)

- [ ] Migrations reversíveis
- [ ] Grafana: filas, providers, workers, outbox lag, outbox dead, consumer duration
- [ ] Health: API · Workers · Outbox Publisher
- [ ] Backup/restore testado
- [ ] Lease recovery testado
- [ ] Reprocessamento manual `dead`

---

## 8. Checklist antes da primeira escrita real (Scryfall → DB)

- [ ] Transações corretas
- [ ] Outbox só após COMMIT
- [ ] Publisher idempotente + leasing + SKIP LOCKED
- [ ] Consumers idempotentes
- [ ] Recuperação após falha de worker
- [ ] Reprocessamento manual
- [ ] Métricas de lag do Outbox
- [ ] Health check do Publisher
- [ ] Payload imutável (teste)
- [ ] EventPublisher mockável sem Redis em unit tests

---

## 9. Correlação (exemplo)

```text
SyncStarted     correlationId=C1  causationId=null
CardUpdated     correlationId=C1  causationId=<SyncStarted.id>
PriceUpdated    correlationId=C1  causationId=<CardUpdated.id>
ListingUpdated  correlationId=C1  causationId=<PriceUpdated.id>
```

---

## 10. Próximo incremento (quando autorizado)

1. Migration `outbox_events` + `consumer_offsets`  
2. Envelope definitivo  
3. `OutboxRepository` (insert-only) + lease claim  
4. `EventPublisher` + `RedisPublisher`  
5. Publisher worker (SKIP LOCKED + lease + dead)

**Sem** Scryfall write · **sem** catalog repositories · **sem** card processors.
