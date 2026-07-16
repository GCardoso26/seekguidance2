# Domain Workers (Etapa 2 / Fase 1)

Parte do mesmo pacote `services/api` — **não** é um segundo backend.

| Processo | Comando | Runtime |
|----------|---------|---------|
| API HTTP | `uvicorn app.main:app` | Python |
| Domain Workers | `npm run worker` (após `npm run build`) | Node 20 + BullMQ |

## Arquitetura

Ver [`docs/architecture/DOMAIN_ORIENTED_PLATFORM.md`](../../docs/architecture/DOMAIN_ORIENTED_PLATFORM.md) (v1.2.1).

```text
src/
  catalog/     CatalogProvider + Scryfall + Registry
  pricing/     PricingProvider interfaces
  media/       MediaService (SHA-256 + pHash placeholder)
  marketplace/ RenderedCard (Catalog + Overlay)
  search/      SearchSyncWorker (multi-evento + IndexProjectionVersion)
  analytics/   analytics_events buffer
  platform/    Event Bus, BullMQ, flags, metrics, logging
  workers/     entrypoint
```

## Setup

```bash
cd services/api
npm install
npm run test
npm run build
npm run worker
```

### Env

| Variável | Default | Uso |
|----------|---------|-----|
| `REDIS_URL` | `redis://127.0.0.1:6379` | BullMQ |
| `LOG_LEVEL` | `info` | Pino |
| `SCRYFALL_ROLLOUT_MODE` | `SHADOW` | OFF\|SHADOW\|CANARY\|LIVE |
| `SCRYFALL_CANARY_PERCENT` | `10` | Canary % |
| `WORKER_IDLE` | `1` | `0` quando processors estiverem ligados |

## Migration

`supabase/migrations/20260723120000_domain_schemas_phase1.sql`

Schemas: `catalog`, `pricing`, `media`, `analytics`, `audit`, `platform`.

## Outbox (v1.2.4)

```bash
# apply migration 20260723130000_platform_outbox.sql
npm run build
DATABASE_URL=... REDIS_URL=... npm run worker:outbox
```

Contratos: leasing, DLQ `dead`, `EventPublisher` / `RedisEventPublisher`, envelope definitivo.
Testes de aceite: `src/platform/outbox/__tests__/outbox.acceptance.test.ts`

## Fase 1 — o que está pronto

- Event Bus versionado (`version` no envelope)
- Filas nomeadas + DLQ + prioridade HIGH/NORMAL/LOW
- Provider Registry (capabilities, health, statistics, cost, rollout)
- Feature / provider / game flags (in-memory)
- ScryfallProvider (piloto MTG)
- Media skeleton (dedup SHA-256 + pHash placeholder)
- SearchSyncWorker + `cards_v1` projection versioning
- Analytics event buffer (pré-aggregators)
- Rendered Card (SoT catalog + overlay marketplace)
- Testes Vitest da fundação

## Próximo (ainda Fase 1 / 2)

- Persistência PostgreSQL nos repositories
- Workers BullMQ processando cada fila
- Wire Media → R2 + virus scan real
- Cutover Scryfall SHADOW → CANARY → LIVE
