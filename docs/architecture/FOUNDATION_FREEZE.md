# Foundation Freeze — v0.2.0-foundation

**Tag:** `v0.2.0-foundation`  
**Data:** 2026-07-16  
**Status:** Congelado — não alterar contratos abaixo sem bump de versão  
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
| Testes de fundação cruzam domínios (catalog test → marketplace/search/media) | Baixo | Aceitável como smoke da fundação; mover depois se desejado |

**Nenhuma importação “para trás”** (ex.: Pricing → Marketplace) encontrada no código de produção.

---

## 2. Contratos públicos congelados

Alterações breaking exigem **nova versão de contrato** (`version` no evento ou bump semântico da tag).

### 2.1 Event Envelope

```ts
{
  event: DomainEventName;
  version: number;          // default 1
  aggregateId: string;
  occurredAt: string;       // ISO-8601
  requestId: string;
  payload: Record<string, unknown>;
}
```

Arquivo: `src/shared/events/types.ts`

### 2.2 Domain Events (nomes)

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

### 2.5 Provider Registry

- Capabilities, Health, Statistics (+ Cost), Rollout `OFF|SHADOW|CANARY|LIVE`
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
- `RenderedCard` / `renderCard()` — `src/marketplace/RenderedCard.ts` (Catalog + Overlay; nunca grava Catalog)

### 2.10 Schemas PostgreSQL (Fase 1)

`catalog.*`, `pricing.*`, `media.*`, `analytics.*`, `audit.*`, `platform.*`  
Migration: `supabase/migrations/20260723120000_domain_schemas_phase1.sql`

---

## 3. Outbox Pattern (adição arquitetural obrigatória — próximo incremento)

**Não implementado neste freeze.** Deve ser o primeiro incremento pós-tag, antes ou junto com repositories.

```text
Catalog Transaction
        ↓
  BEGIN
        ↓
  upsert set / cards / variants / provider_mappings
        ↓
  INSERT outbox_events (same TX)
        ↓
  COMMIT
        ↓
  Outbox Publisher (poll / LISTEN)
        ↓
  Redis Event Bus / Stream
        ↓
  Consumers (Search, Analytics, …)
```

### Regras

1. **Nunca** publicar Domain Event antes do `COMMIT`.
2. Outbox na mesma transação que a mutação de domínio.
3. Publisher idempotente (`event_id` único); consumers idempotentes.
4. Monitorar `outbox_events` pendentes (lag, dead letters).

### Tabela sugerida (`platform.outbox_events` ou `catalog.outbox_events`)

```text
id, event, version, aggregate_id, request_id, payload jsonb,
occurred_at, created_at, published_at nullable, attempts, last_error
```

---

## 4. Sequência pós-freeze (não iniciar até tag)

1. **Outbox** (schema + publisher)  
2. **Repositories PostgreSQL** — Catalog / Set / Variant / ProviderMapping (sem Scryfall write)  
3. **Transaction layer** — upsert atômico + outbox insert  
4. **BullMQ processors** — thin: Provider → Repository → Outbox  
5. **Scryfall** OFF → SHADOW (validar counts/hashes/mappings) → CANARY → LIVE  

### Checklist operacional (antes da Fase 3 Media/R2)

- [ ] Migrations reversíveis (down ou estratégia equivalente)
- [ ] Dashboards Prometheus/Grafana mínimos (filas, providers, workers)
- [ ] Health check independente API vs Workers
- [ ] Backup/restore do banco testado
- [ ] Monitoramento do Outbox (eventos pendentes)

---

## 5. Conteúdo da tag

- `services/api/src/**`
- `services/api/package.json`, `package-lock.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`
- `services/api/Dockerfile.workers`, comentário em `Dockerfile.production`
- `supabase/migrations/20260723120000_domain_schemas_phase1.sql`
- `docs/architecture/DOMAIN_ORIENTED_PLATFORM.md`
- `docs/architecture/FOUNDATION_FREEZE.md`
- `services/api/src/README.md`

**Excluído de propósito:** WIP sandbox, audits de validação, changes em `identity_platform` / `tournament_platform` não relacionados.
