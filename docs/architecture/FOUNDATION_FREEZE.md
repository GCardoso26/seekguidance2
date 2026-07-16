# Foundation Freeze — v0.2.0-foundation

**Tag:** `v0.2.0-foundation`  
**Data:** 2026-07-16  
**Status:** Congelado + emendas pré-incremento (ver §6)  
**Escopo:** Etapa 2 / Fase 1 (fundação) apenas

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

### Violações / débitos aceitos neste freeze

| Item | Severidade | Nota |
|------|------------|------|
| `CatalogSyncService` publica direto no Event Bus (sem Outbox / sem commit DB) | Alto (próximo trabalho) | Aceito só porque ainda não há persistência |
| Testes de fundação cruzam domínios (catalog test → marketplace/search/media) | Baixo | Aceitável como smoke da fundação |

**Nenhuma importação “para trás”** (ex.: Pricing → Marketplace) encontrada no código de produção.

---

## 2. Contratos públicos congelados (+ emendas §6)

Alterações breaking exigem **nova versão de contrato** (`event_version` / `schema_version` ou bump de tag).

### 2.1 Event Envelope (emendado §6.4)

```ts
{
  eventType: DomainEventName;   // ex.: "CardUpdated"
  eventVersion: number;         // evolução semântica do tipo de evento
  schemaVersion: number;        // evolução do shape do payload
  aggregateType: string;        // ex.: "catalog_card"
  aggregateId: string;
  occurredAt: string;           // ISO-8601
  requestId: string;
  traceId?: string;
  projectionVersion?: string;   // ex.: "cards_v1" — qual índice Search alimentar
  payload: Record<string, unknown>;
}
```

Arquivo alvo: `src/shared/events/types.ts` (atualizar no incremento Outbox; código da tag ainda usa `event`/`version`).

### 2.2 Domain Events (nomes / eventType)

- `CardUpdated`
- `SetUpdated`
- `VariantUpdated`
- `MediaUpdated`
- `PriceUpdated`
- `CurrencyUpdated`
- `MarketplaceListingUpdated`
- `ProviderHealthChanged`

### 2.3 CatalogProvider

Métodos: `syncSets`, `syncCards`, `syncVariants`, `syncImages`, `syncLegality`, `syncRulings`  
Campos: `providerId`, `gameCode`, `capabilities`  
Arquivo: `src/catalog/providers/interfaces/CatalogProvider.ts`

### 2.4 PricingProvider

Métodos: `syncPrices`, `syncMarket`, `syncHistory`  
Contexto: `catalogCardId`, `variantId?`, `providerMappings`, `requestId`  
Arquivo: `src/pricing/providers/interfaces/PricingProvider.ts`

### 2.5 Provider Registry (+ Cost / Availability — §6.10)

- Capabilities, Health, Statistics, Cost, Rollout `OFF|SHADOW|CANARY|LIVE`
- Métricas: `estimated_cost`, `requests_today`, `quota_remaining`, `avg_latency`, `error_rate`, `availability`, `success_rate`
- Arquivo: `src/catalog/registry/ProviderRegistry.ts`

### 2.6 Feature Flags

Scopes: `feature` | `provider` | `game`  
Arquivo: `src/platform/feature-flags/FlagStore.ts`

### 2.7 DTOs públicos (Catalog)

`SetDTO`, `CardDTO`, `VariantDTO`, `RulingDTO`, `ImageJobDTO`, `SyncContext`, `SyncResult`

### 2.8 Filas BullMQ (nomes estáveis)

| Fila | DLQ | Prioridade típica |
|------|-----|-------------------|
| `catalog.sets` | `catalog.sets.dlq` | NORMAL |
| `catalog.cards` | `catalog.cards.dlq` | NORMAL |
| `catalog.variants` | `catalog.variants.dlq` | NORMAL |
| `media.process` | `media.process.dlq` | LOW |
| `catalog.legality` | `catalog.legality.dlq` | NORMAL |
| `catalog.rulings` | `catalog.rulings.dlq` | LOW |
| `pricing.prices` | `pricing.prices.dlq` | HIGH |
| `pricing.market` | `pricing.market.dlq` | NORMAL |
| `pricing.history` | `pricing.history.dlq` | LOW |
| `currency.rates` | `currency.rates.dlq` | NORMAL |
| `search.sync` | `search.sync.dlq` | HIGH |
| `analytics.ingest` | `analytics.ingest.dlq` | LOW |

Prioridades: `HIGH=1`, `NORMAL=5`, `LOW=10` (BullMQ: menor número = maior prioridade).

Arquivo: `src/platform/bullmq/queues.ts`

### 2.9 Media / Marketplace read models

- `MediaProcessInput` / `MediaAssetRecord` — `src/media/MediaService.ts`
- `RenderedCard` / `renderCard()` — `src/marketplace/RenderedCard.ts`

### 2.10 Schemas PostgreSQL (Fase 1)

`catalog.*`, `pricing.*`, `media.*`, `analytics.*`, `audit.*`, `platform.*`  
Migration: `supabase/migrations/20260723120000_domain_schemas_phase1.sql`  
Emendas de schema (Outbox, consumer_offsets, current_price_snapshot, índices) entram em migrations **novas** pós-tag — não reescrever a migration da tag.

---

## 3. Fluxo transacional canônico (proibido fantasma)

```text
Request
  ↓
TransactionManager.begin()
  ↓
Repositories (upserts)          // mesma TX
  ↓
OutboxRepository.insert(...)    // mesma TX
  ↓
COMMIT
  ↓
Outbox Publisher (poll / LISTEN)
  ↓
Redis Event Bus
  ↓
Consumers (idempotentes via consumer_offsets)
```

**Proibido:**

```text
Repository → Publish Event → Commit
```

---

## 4. Outbox (idempotente) — contrato de tabela

Schema: `platform.outbox_events`

```text
id               uuid PRIMARY KEY
aggregate_type   text NOT NULL
aggregate_id     text NOT NULL
event_name       text NOT NULL          -- = eventType
event_version    int  NOT NULL DEFAULT 1
schema_version   int  NOT NULL DEFAULT 1
payload          jsonb NOT NULL
status           text NOT NULL          -- pending | publishing | published | failed
attempts         int  NOT NULL DEFAULT 0
next_retry_at    timestamptz
published_at     timestamptz
created_at       timestamptz NOT NULL DEFAULT now()
request_id       text
trace_id         text
projection_version text                  -- opcional; ex.: cards_v1
last_error       text
```

### Regras do Publisher

1. Seguro para reexecução (at-least-once).
2. Marca `published` só após ack do bus.
3. Backoff via `next_retry_at` + `attempts`.
4. Nunca apaga linha sem política de retenção explícita.

---

## 5. Consumers idempotentes

Schema: `platform.consumer_offsets`

```text
consumer_name   text NOT NULL
event_id        uuid NOT NULL REFERENCES platform.outbox_events(id)
processed_at    timestamptz NOT NULL DEFAULT now()
PRIMARY KEY (consumer_name, event_id)
```

```text
PriceUpdated
  ↓
Search Worker
  ↓
já processei (consumer_offsets)?
  ↓ sim → ignora
  ↓ não → processa → INSERT offset (mesma TX do side-effect quando possível)
```

---

## 6. Emendas pré-incremento (após tag, antes do código Outbox)

### 6.1 Ordem de implementação (canônica)

```text
1.  Outbox (schema + OutboxRepository + Publisher)
2.  TransactionManager
3.  Repository interfaces (domínio) + Postgres* implementations
4.  BullMQ processors (thin: Provider → Repo → Outbox)
5.  Persistência real ligada aos processors
6.  Scryfall OFF → SHADOW
7.  Scryfall CANARY
8.  Scryfall LIVE
9.  Demais Catalog Providers
10. Media Pipeline
11. Pricing
12. Search (consumers + projection_version)
13. Analytics
```

**Transaction Layer fica entre Outbox e Repositories na ordem de construção**, e na runtime envolve ambos:

```text
TransactionManager
  ├── CatalogRepository (interface)
  │     └── PostgresCatalogRepository
  ├── SetRepository / VariantRepository / ProviderMappingRepository
  └── OutboxRepository
```

### 6.2 Repository = interface de domínio

```text
CatalogRepository          // domínio — sem I/O vendor
  ↓
PostgresCatalogRepository  // infraestrutura
  ↓
PostgreSQL / Supabase
```

Nunca expor `SupabaseCatalogRepository` para services de domínio.

### 6.3 Índices `provider_mappings` (obrigatórios)

```text
(provider, provider_card_id)
(provider, provider_variant_id)
(catalog_card_id)
(catalog_variant_id)
```

### 6.4 Pricing: current + history

Emenda ao modelo da Fase 1:

| Tabela | Papel |
|--------|-------|
| `pricing.current_price_snapshot` | 1 linha “quente” por (card, variant?, market, condition, finish, …) |
| `pricing.price_history` | append-only |

Sync:

```text
insert price_history
  ↓
upsert current_price_snapshot
```

Consultas de vitrine leem **current**; gráficos leem **history**.  
(`pricing.price_snapshots` da migration Fase 1 será migrada/renomeada — não sobrescrever in-place como única verdade.)

### 6.5 Event: `projection_version`

Campo no envelope para o SearchSyncWorker saber se alimenta `cards_v1` ou `cards_v2`.

### 6.6 Registry — métricas de custo / disponibilidade

Além do já previsto: `estimated_cost`, `requests_today`, `quota_remaining`, `avg_latency`, `error_rate`, `availability`, `success_rate` — base para política futura de “provider mais barato dentro do SLA”.

---

## 7. Checklist operacional (antes da Fase 3 Media/R2)

- [ ] Migrations reversíveis (down ou estratégia equivalente)
- [ ] Dashboards Prometheus/Grafana mínimos (filas, providers, workers, **outbox lag**)
- [ ] Health check independente API vs Workers
- [ ] Backup/restore do banco testado
- [ ] Monitoramento do Outbox (pending / failed / next_retry_at)
- [ ] Monitoramento de `consumer_offsets` (duplicatas evitadas / gaps)

---

## 8. Conteúdo da tag `v0.2.0-foundation`

- `services/api/src/**`
- `services/api/package.json`, `package-lock.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`
- `services/api/Dockerfile.workers`, comentário em `Dockerfile.production`
- `supabase/migrations/20260723120000_domain_schemas_phase1.sql`
- `docs/architecture/DOMAIN_ORIENTED_PLATFORM.md`
- `docs/architecture/FOUNDATION_FREEZE.md` (este arquivo; emendas §6 pós-tag)

**Excluído:** WIP sandbox, audits, changes não relacionados em identity/tournament.

---

## 9. Próximo passo autorizado

Quando o produto disser “pode iniciar”:

1. Migration `platform.outbox_events` + `platform.consumer_offsets`
2. Envelope `eventType` / `event_version` / `schema_version` / `projection_version`
3. `OutboxRepository` + Publisher idempotente
4. **Só então** `TransactionManager` + repository interfaces

Não implementar Scryfall write nem processors de cards até Outbox + TX estarem verdes nos testes.
