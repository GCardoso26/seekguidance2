# Sprint 7.3 — Seller Portal

**Status:** Entregue  
**KPI:** `seller_time_to_first_listing_ms` — P50 &lt; 60s · P95 &lt; 120s (teste cego)

## Fluxo

```text
/register → /seller → /seller/onboard → /seller/listings/new → publish
```

Wizard: buscar carta → dados comerciais → PUBLICAR (sem IDs técnicos).

## APIs

| Ação | Client |
|------|--------|
| Buscar | `publicApi.search` · `listVariants` |
| Loja | `marketplaceApi.onboardSeller` |
| Publicar | `createInventory` → `createListing` |

Após onboard: `authApi.refresh()` para JWT com role `seller`.

## Analytics

`seller_shop_created` · `seller_first_search` · `seller_card_selected` · `seller_listing_publish_started` · `seller_listing_published` · `seller_time_to_first_listing_ms`

## Bloqueado

Dashboard · fotos · SKU · tags · logística · ERP

## Próximo

**7.4** Cart → Checkout start
