# Sprint 2.5 — SHADOW Stress

**Objetivo:** provar resiliência do pipeline SHADOW. **Sem features novas.**  
**Não avançar para CANARY** só porque `readyForCanary=true` no primeiro sync.

## Pré-requisito

Sprint 2 concluída: commit → Outbox INSERT → publish (ADR-004).

## Cenários

| # | Cenário | Esperado |
|---|---------|----------|
| C1 | Re-sync mesmo set (N vezes) | 1ª: creates; seguintes: unchanged; mutate → updates; 0 duplicatas |
| C2 | Dois sets | FKs válidas; sem cross-duplicação |
| C3 | Worker interrompido (lease) | Lease expira; outro worker assume; 0 eventos perdidos |
| C4 | Publisher/Redis down | Outbox acumula; recover → todos publicados; dead=0 |
| C5 | Timeout do provider | Retry; sync completa; dead=0 |
| C6 | Duas syncs simultâneas (mesmo set) | Sem race de duplicação; consistency OK |

## Como rodar

```bash
cd services/api
# DATABASE_URL no .env
npm test -- src/catalog/sync/__tests__/shadowStress.pg.test.ts
```

Ops (re-sync real, ex. lea × N):

```bash
npm run sync:scryfall:shadow lea   # repetir e inspecionar inserts/updates/unchanged
```

## Fix estrutural validado nesta sprint

Persist Card/Variant agora resolvem o `catalog_*_id` via **Provider Mapping** antes do upsert.  
Sem isso, re-sync no Postgres criava novas entidades (ON CONFLICT só por `id`).

## Gate pós–2.5

Só então considerar CANARY, com checklist em [`SHADOW_EXIT_GATE.md`](./SHADOW_EXIT_GATE.md) + stress C1–C6 verdes.

## Próximo (Sprint 3)

**Apenas Search:** `CardUpdated` → Search Consumer → Projection → Meilisearch.  
Sem Marketplace / Checkout / novos providers.
