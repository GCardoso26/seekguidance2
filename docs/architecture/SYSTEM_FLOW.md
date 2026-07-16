# System Flow — o mapa do sistema

**Status:** Vivo (atualizar quando um fluxo mudar)  
**Objetivo:** mostrar como um request atravessa a plataforma inteira, de ponta a ponta.  
**Relaciona:** [`DOMAIN_ORIENTED_PLATFORM.md`](./DOMAIN_ORIENTED_PLATFORM.md) · [`MARKETPLACE_DOMAIN.md`](./MARKETPLACE_DOMAIN.md) · [`IDENTITY_DOMAIN.md`](./IDENTITY_DOMAIN.md) · [`READ_MODEL_CONTRACT.md`](./READ_MODEL_CONTRACT.md)

Legenda de status: ✅ existe · 🚧 em construção · ⛔ futuro.

---

## Fluxo 1 — Ingestão oficial (Catalog → Busca)

```text
Scryfall (provider)
   ↓  ✅ ScryfallShadowSync
Catalog (SoT, imutável)
   ↓  ✅ commit → Outbox (ADR-004)
Outbox
   ↓  ✅ EventPublisher
Redis Streams
   ↓  ✅ SearchEventConsumer (idempotente via consumer_offsets)
Search Projection (ProjectionManager → Meilisearch)
   ↓  ✅ SearchQueryService
API Pública  (GET /api/v1/*)
   ↓  ⛔
Analytics
```

Norte operacional: **lead time de sincronização** (provider → searchable) P95.

---

## Fluxo 2 — Lojista publica um anúncio (Marketplace → Busca → UI)

```text
Seller Login                     ✅ 4.3 (Identity → JWT)
   ↓
JWT + RBAC                       ✅ 4.3
   ↓
POST /api/v1/marketplace/listing ✅ 4.3 (write autenticado)
   ↓
PublishListingApplicationService ✅ (domínio)
   ↓  commit → Outbox            ✅ MarketplaceListingUpdated
Outbox → Redis                   ✅
   ↓
Search Projection                ✅ (aplica storeId/price/stock/finish)
   ↓
API Pública mostra a oferta      ✅ GET /api/v1/marketplace/cards/:id/offers
   ↓
Frontend monta RenderedCard      ✅ (Catalog oficial + overlay de oferta)
```

> **Smoke oficial:** `npm run smoke:golden-path` (Sprint 4.4) — Catalog→Search→Auth→Listing→Offers.  
> Gate CI + smoke periódico + chaos + budgets: [`SPRINT_44_READINESS.md`](./SPRINT_44_READINESS.md).

Cadeia de agregados: `User → SellerProfile → Seller → Inventory → Listing`.

---

## Fluxo 3 — Compra (Checkout) — Sprint 5

```text
Search / Offers
   ↓
Cart                         ✅ 5.1 (intenção; preço snapshot)
   ↓
CheckoutSession              ✅ 5.1
   ↓
InventoryReservation         ✅ 5.1 model · 🚧 5.3 engine
   ↓
Payment (FakePaymentProvider)✅ 5.1 port · 🚧 5.5 webhook
   ↓
Order PAID / Confirmation    ✅ 5.1
```

Contrato: [`ORDER_DOMAIN.md`](./ORDER_DOMAIN.md).  
Regras: preço = snapshot · reserva antes do pagamento · Order não muta Listing.

---

## Onde cada responsabilidade vive

| Etapa | Domínio | Escreve |
|-------|---------|---------|
| Ingestão oficial | Catalog | `catalog.*` |
| Projeção de busca | Search | índice Meilisearch (derivado) |
| Identidade / papéis | Identity | `identity.*` (4.2) |
| Loja / estoque / anúncio | Marketplace | `marketplace.*` (4.2) |
| Pedido / pagamento | Order/Payments | ⛔ Sprint 5 |
| Métricas | Analytics | ⛔ |

Regra de ouro: eventos cruzam contextos **sempre via Outbox**; leitura pública **sempre via projeção**, nunca tocando o SoT.
