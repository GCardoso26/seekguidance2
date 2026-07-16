# Search Projection

**Status:** Sprint 3 ✅ · Sprint 3.1 em curso  
**Pré-requisito:** Sprint 2.5 SHADOW stress (commit → Outbox → publish)

## Fluxo

```text
Domain Events (Outbox → Redis Streams)
  → SearchEventConsumer (thin + consumer_offsets)
  → ApplySearchEventApplicationService
  → SearchProjectionRepository
  → Meilisearch (cards_vN)

Index lifecycle:
  ProjectionManager → ensure / rebuild / alias swap / retire / coverage / drift / lead time
```

**Proibido:** consultar Providers · mutar Catalog · indexar inline no sync · Controller → Catalog Repository.

## Peças

| Peça | Papel |
|------|--------|
| `SearchEventConsumer` | Só aplica eventos + offsets |
| `ProjectionManager` | Índices, rebuild, alias, retire, versão, métricas |
| `SearchProjectionRepository` | Port InMemory \| Meilisearch |
| `SearchProjectionVersion` | `cards_v1` → `v2` → `v3` |
| `ProjectionHealth` / `ProjectionLag` | saúde operacional |
| `ProjectionCoverage` | Catalog N vs Projection M (%) |
| `ProjectionDrift` | changed_since + lag temporal |
| `SyncLeadTime` | Provider → searchable (P50/P95) |
| `SearchQueryService` | Contrato read-only congelado (Sprint 3.5) |

## Filtros

nome · oracle · set · idioma · preço · finish · loja · estoque

## Redis (Sprint 3.1)

```bash
REDIS_URL=... DATABASE_URL=... npm run worker:search
SEARCH_REPLAY=1   # opcional: replay stream from 0
```

Stream: `judgetcg:domain-events` · Group: `search-projection`

## Lead time (norte operacional)

```text
Provider → Sync → Commit → Outbox → Publish → Redis → Consumer → Meili → API
```

Meta sugerida: **P95** dentro do SLO de volume (ex.: poucos minutos).

## Roadmap

```text
Sprint 3     Search Projection (base)           ✅
Sprint 3.1   Redis + ProjectionManager          ✅
Sprint 3.5   Public Read API /api/v1            ✅  → READ_MODEL_CONTRACT.md
Sprint 4     Marketplace
Sprint 5     Checkout
```
