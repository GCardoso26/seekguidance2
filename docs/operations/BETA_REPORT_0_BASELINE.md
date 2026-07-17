# Beta Report #0 — Baseline (Lorcana-First)

**Preencher no Dia 0, antes de qualquer convite.**  
**Protocolo:** [`BETA_WAVE1_OPERATION_PROTOCOL.md`](./BETA_WAVE1_OPERATION_PROTOCOL.md)  
**Beachhead:** Disney Lorcana Brasil · [`MVP_1_0_RELEASE_PLAN.md`](../architecture/MVP_1_0_RELEASE_PLAN.md)

**Data:** 2026-07-17  
**Ambiente / URL:** local (`DATABASE_URL` · Public API smoke in-process)  
**Autor:** Auto (ops Dia 0) · founder confirma URL de beta público

---

## Catalog

| Métrica | Valor |
|---------|-------|
| Cartas Lorcana indexadas (aprox.) | **10** (watchlist seed) |
| `game` beachhead | `LORCANA` / `lorcana-dataset` |
| Notas | Seed `npm run sync:lorcana:seed` OK · sets TFC+ROF com cartas; ITI/URS/SSK só set |

Cartas no catálogo:

- Rapunzel – Gifted with Healing  
- Belle – Strange but Special  
- Be Prepared · A Whole New World · Diablo – Devoted Herald  
- Stitch – Rock Star · Elsa – Spirit of Winter  
- Mickey Mouse – Brave Little Tailor · Ariel – Spectacular Singer · Winnie the Pooh – Hunny Wizard  

## Marketplace

| Métrica | Valor |
|---------|-------|
| Sellers | **0** (esperado) |
| Listings ativos | **0** (esperado) |
| Cartas com oferta | **0** (esperado) |

## Buyer

| Métrica | Valor |
|---------|-------|
| Ofertas na watchlist | **0** (esperado) |
| Eventos buyer (24h) | **0** (esperado) |

## Seller

| Métrica | Valor |
|---------|-------|
| Ativação | **0** (esperado) |
| Portal visits | 0 |

## Liquidez Watchlist Lorcana (spot check Dia 0)

| Carta | Oferta? | No catálogo? |
|-------|---------|--------------|
| Diablo – Devoted Herald | Não | Sim |
| Be Prepared | Não | Sim |
| A Whole New World | Não | Sim |
| Belle – Strange but Special | Não | Sim |
| Rapunzel – Gifted with Healing | Não | **Sim · SMOKE_OK** |
| Stitch – Rock Star | Não | Sim |
| Elsa – Spirit of Winter | Não | Sim |
| Encantada (expansão atual) | Não | — (slots manuais) |

## Infra (Dia 0)

- [x] Migration `catalog_variant_id` → text aplicada (`uuid` → `text`)  
- [x] `npm run sync:lorcana:seed` OK (10 cartas)  
- [x] Search `q=Rapunzel` → hit (projection rebuild + HTTP 200)  
- [ ] Redis / Meili em produção (hoje Redis local **offline** — seed usou publisher in-memory; projection de runtime precisa Redis+worker ou rebuild)  
- [ ] Cadastro / login / refresh OK (pendente URL beta)  
- [ ] Publish carta Lorcana da watchlist OK (pendente round-trip manual no front)  
- [ ] Oferta visível no buyer OK  
- [ ] Analytics visível OK  

## Assinatura

Baseline **parcialmente** congelado (infra catalog+search smoke OK).  
Pendências antes de Lote 1 em ambiente compartilhado: Redis up · workers outbox/search · URL beta · round-trip publish manual.

| KPI | Baseline Dia 0 |
|-----|----------------|
| **LPC** | **0** |
| **LCS** | **0%** (0/8 watchlist com oferta — esperado) |

Metas: LPC ≥1 · LCS ≥80% · ≥5 lojas · 150–300 listings relevantes.

**P0 desbloqueio:** migration + seed + SMOKE_OK Rapunzel (2026-07-17).
