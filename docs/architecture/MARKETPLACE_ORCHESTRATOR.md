# Marketplace BC — Orchestrator

O Marketplace **não possui lógica de domínio de Catalog, Pricing ou Inventory**.

Ele **coordena** fluxos via **Saga / Process Manager**.

```
Catalog (VariantID)
        ↓
Marketplace.publishProductListing
        ↓
Saga: PublishProductListing
        ├── EnsureSeller
        ├── PersistListing          → marketplace.listings
        ├── InventoryUpsert         → Inventory BC
        ├── PricingRefresh          → Pricing BC (optional)
        ├── SearchReindex           → event MarketplaceListingPublished
        ├── AnalyticsIngest         → event + seller_metrics
        └── NotificationPublish     → NotificationRequested
```

## Schema

| Tabela | Papel |
|--------|--------|
| `marketplace.listings` | Referência (`product_variant_id` ou `catalog_variant_id`) + preço/condição/status |
| `listing_status` | Timeline append-only |
| `listing_media` | Links para `media.assets` (nunca bytes) |
| `listing_metrics` | Projeção (views/clicks/sales) |
| `seller_metrics` | Projeção agregada |

`seller_products` permanece **legado** (checkout atual); migração gradual.

## Saga

- `platform.sagas` / `platform.saga_steps`
- `SagaOrchestrator` — retry exponencial, compensate, optional steps
- Eventos: `SagaCompleted` / `SagaFailed`

## Código

- `src/platform/saga/SagaOrchestrator.ts`
- `src/marketplace/application/MarketplaceOrchestrator.ts`
- API: `POST /runtime/judge/marketplace/listings/product`

## ADR alinhamento

- ADR-007: Listing referencia Catalog IDs; não copia nome/imagem
- ADR-002: BullMQ transporta comandos; sagas emitem domain events via `platform.domain_events`

## Roadmap 90d (após este épico)

```
Checkout BC → Orders BC → Notification BC → Analytics BC → Search BC → Identity BC → Fulfillment BC
```
