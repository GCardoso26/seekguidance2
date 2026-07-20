# Public API Boundaries

**ADR:** [ADR-011](./adr/ADR-011-public-api-boundaries.md)

Cada Bounded Context expõe apenas o que está abaixo.  
Tudo que não está listado é **interno** e não pode ser importado por outro BC.

---

## Catalog

**Expose**

| Tipo | Símbolo |
|------|---------|
| Service | Catalog sync / query via Application Services existentes |
| Events | `CardUpdated.v1`, `SetUpdated.v1`, `VariantUpdated.v1` |
| Queries | Card/Set search projections (read models) |

**Never**

- `catalog/persistence/*`
- `catalog.*` SQL direto de outros BCs

---

## Assets

**Expose**

| Tipo | Símbolo |
|------|---------|
| Service | `AssetService` / `createAssetService` |
| DTOs | `IngestAssetInput`, `AssetRecord` |
| Events | `AssetCreated.v1` / `MediaUpdated.v1` |

**Never**

- `media.assets` SQL de outros BCs

---

## Pricing

**Expose**

| Tipo | Símbolo |
|------|---------|
| Service | `PricingService` / `createPricingService` |
| Queries | `getValuation(subjectType, subjectId)` |
| Events | `PriceChanged.v1` |

**Never**

- `pricing/persistence/*`
- `pricing.*` tables

---

## Inventory

**Expose**

| Tipo | Símbolo |
|------|---------|
| Service | `InventoryService` — `upsertStock`, `hold`, `confirm`, `release` |
| Events | `StockChanged.v1`, `InventoryReserved.v1`, `InventoryReleased.v1` |

**Never**

- `inventory.stock_units` / `inventory.reservations` SQL externo

---

## Marketplace

**Expose**

| Tipo | Símbolo |
|------|---------|
| Service | `MarketplaceOrchestrator` / `createMarketplaceOrchestrator` |
| Commands | `PublishProductListingCommand` |
| Queries | `ListingPublicQuery` / `createListingPublicQuery` / `ListingPublicDTO` |
| Events | `MarketplaceListingCreated.v1`, `MarketplaceListingPublished.v1`, `MarketplaceListingUpdated.v1` |

**Never**

- `marketplace/persistence/*` de fora do BC
- Repositórios internos
- SQL `marketplace.*` a partir de outros BCs (usar `ListingPublicQuery`)

---

## Saga

**Expose**

| Tipo | Símbolo |
|------|---------|
| Service | `SagaOrchestrator` / `createSagaOrchestrator` |
| Events | `SagaCompleted.v1`, `SagaFailed.v1` |

---

## Search / Analytics

**Expose**

| Tipo | Símbolo |
|------|---------|
| Projection consumers | `ProjectionConsumer` implementations |
| Events consumed | ListingPublished, PriceChanged, StockChanged |

**Never**

- Escrever em schemas de Marketplace/Pricing/Inventory

---

## Platform (shared)

**Expose**

- `DomainEventFactory`, `EventRegistry`
- `IdempotentCommandHandler`, `FeatureFlagService`
- `OutboxRepository` (via Application Services)
- `CommandBus` / `QueryBus` (CQRS)
- `ProjectionWorker`

---

## Checkout

**Expose**

| Tipo | Símbolo |
|------|---------|
| Service | `CheckoutService` / `createCheckoutService` |
| Aggregate | `CartAggregate` |
| Coupon | `CouponEngine` / Rules (Fixed, Percentage, FreeShipping, …) |
| Payment | `PaymentGateway` / `createPaymentGateway` (adapters) |
| Validation | `CheckoutValidationPipeline` |
| Commands | `AddToCart`, `UpdateQuantity`, `MergeGuest/UserCart`, `StartCheckout` |
| Events | `CheckoutStarted.v1`, `PaymentApproved.v1`, `InventoryConfirmed.v1`, `OrderCreated.v1`, `CheckoutCompleted.v1` |
| HTTP | `/api/v1/checkout-v2/*` incl. `POST .../confirm-payment` |
| Barrel | `checkout/public.ts` |

**May call**

- `ListingPublicQuery` (`marketplace/public`)
- `PricingService` (`pricing/public`)
- `InventoryService.hold|confirm|release` (`inventory/public`)
- `SagaOrchestrator`, Outbox, `FeatureFlagService` (`checkout_v2`), `DomainEventFactory`

**Never**

```sql
SELECT * FROM marketplace.listings;
UPDATE inventory.stock_units ...;
SELECT * FROM pricing.…;
```

- Importar `*/persistence/*` de outro BC
