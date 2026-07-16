# Sprint 7 Plan — Buyer Experience + Seller Portal MVP

**Status:** ✅ Fechada — DoD em [`SPRINT_7_DOD.md`](./SPRINT_7_DOD.md)  
**KPI:** Time-to-first-listing **P50 &lt; 60s** · **P95 &lt; 120s**  
**Contratos:** [`SELLER_EXPERIENCE_CONTRACT.md`](./SELLER_EXPERIENCE_CONTRACT.md) · [`BUYER_EXPERIENCE_CONTRACT.md`](./BUYER_EXPERIENCE_CONTRACT.md)

## Objetivo

Primeira superfície real de produto. **Sem novas regras de domínio.**

## Stack

```text
apps/web
  Next.js 15 · React · TypeScript · Tailwind
  TanStack Query · Zod · React Hook Form
```

Clients: `PublicApiClient` · `MarketplaceApiClient` · `CheckoutApiClient` · `AuthApiClient`

## Fatias

| Slice | Entrega |
|-------|---------|
| **7.1** | Fundação `apps/web` · auth JWT/refresh · clients HTTP — ver [`apps/web/docs/SPRINT_7_1.md`](../../apps/web/docs/SPRINT_7_1.md) |
| **7.2** | Comprador: busca · PDP (Catalog \| Ofertas) — ver [`apps/web/docs/SPRINT_7_2.md`](../../apps/web/docs/SPRINT_7_2.md) |
| **7.3** | Seller portal: onboard · wizard publicar (&lt;60s) · meus anúncios — [`apps/web/docs/SPRINT_7_3.md`](../../apps/web/docs/SPRINT_7_3.md) |
| **7.4** | Carrinho mínimo · checkout start — [`apps/web/docs/SPRINT_7_4.md`](../../apps/web/docs/SPRINT_7_4.md) |

## Definition of Done (completo)

**Produto:** conta · loja · anúncio · busca · ofertas · carrinho · checkout start ✅  

**Técnico:** prod-like · JWT · refresh · loading/error/empty · métricas funil ✅  

**Negócio:** caminho técnico A vende / B compra existe ✅ · teste humano &lt;60s = pendência operacional (Sprint 8)

## Sequência após DoD

[`SPRINT_8_PLAN.md`](./SPRINT_8_PLAN.md) — Beta lojas · Sprint 9 — Payment real + comissão.
