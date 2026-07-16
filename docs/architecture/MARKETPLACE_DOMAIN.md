# Marketplace Domain (Sprint 4+)

**Status:** Em construção — Sprint 4  
**Equivale a:** `FOUNDATION_FREEZE.md`, mas para o domínio de produto.  
**Contrato base:** [ADR-007](./adr/ADR-007-marketplace-domain-boundaries.md) · [ADR-003](./adr/ADR-003-marketplace-overlay.md) · [ADR-001](./adr/ADR-001-catalog-source-of-truth.md)

## Cadeia de agregados

```text
Seller
   │
Inventory
   │
Listing
   │
RenderedCard   (read model: Catalog/Search + overlay)
   │
Checkout       (Sprint 5 — ver ORDER_DOMAIN.md)
   │
Order          (Sprint 5 — bounded context `order/`, fora do Marketplace)
```

## Agregados

### Seller
Quem vende. `status` (pending/active/suspended), `verification` (unverified/pending/verified), `configuration`.  
Não guarda anúncios nem pedidos.

### Inventory
Quantas cartas existem. `InventoryItem { sellerId, catalogCardId, catalogVariantId, quantity }`.  
**Sem preço.**

### Listing
Quanto custa. `priceCents`, `currency`, `condition`, `language`, `notes`, `finish`.  
Referencia `catalogCardId` + `catalogVariantId` + `sellerId` (+ `inventoryItemId`).  
**Nunca** copia `name`/`oracle`/`artist` — isso é Catalog.

### Order
Somente Sprint 5.

## Fronteiras (invioláveis)

1. Catalog imutável — Marketplace nunca escreve `catalog.*`.
2. Listing referencia Catalog IDs; nunca copia dados oficiais.
3. Sem FK para Meilisearch — sempre Catalog IDs.
4. RenderedCard montado na borda; nunca gravado no Catalog.
5. `MarketplaceListingUpdated` sai só via Outbox (ADR-004) → Search.

## Composição na UI

```text
Search API   → dados oficiais da carta (Catalog projetado)
Marketplace API → ofertas (Listing: preço, estoque, condição)
        ↓ overlay
   RenderedCard   (montado pelo frontend)
```

## API

Raiz separada: **`/api/v1/marketplace`** (read-only nesta sprint).

- `GET /api/v1/marketplace/listings?cardId=` — ofertas de uma carta
- `GET /api/v1/marketplace/listings/:id`
- `GET /api/v1/marketplace/sellers/:id`
- `GET /api/v1/marketplace/sellers/:id/listings`
- `GET /api/v1/marketplace/cards/:cardId/offers` — ofertas + resumo p/ overlay

Escrita (onboarding seller, publicar listing) existe na camada de domínio (Application Services) e será exposta na **Sprint 4.1** com Identity + JWT + RBAC simples.

## Autenticação (Sprint 4.1 — próximo incremento)

```text
Seller → Identity → JWT → RBAC
```

Sem OAuth complexo. Checkout/Payments continuam separados (Sprint 5).

## Métricas de negócio (a partir de agora)

| Área | Métrica |
|------|---------|
| Marketplace | Tempo para um lojista criar o primeiro anúncio |
| Busca | Tempo entre pesquisar uma carta e ver um anúncio |
| Checkout | Tempo para concluir uma compra (Sprint 5) |
| Operação | Tempo para detectar e resolver falha de sincronização |

## Fora de escopo (bloqueado)

Order/Checkout/Payments (Sprint 5) · Analytics pesado · IA · Chat · Feed · Social · Avaliações complexas · Recomendações.
