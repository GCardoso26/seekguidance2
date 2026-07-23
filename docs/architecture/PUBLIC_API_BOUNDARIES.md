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
| Service | `AssetService` / `createAssetService` via `assets/public.ts` |
| DTOs | `IngestAssetInput`, `AssetRecord`, `AssetMetadata` |
| Catalog | `MEDIA_TYPES`, `CARD_IMAGE_SIZES`, `PRODUCT_IMAGE_SIZES`, `HERO_IMAGE_SIZES` |
| CDN | `buildDerivativeSet`, `buildFormatDerivativeMap`, `pickSafeDerivativeSize` |
| Events | `AssetCreated.v1` / `MediaUpdated.v1` |

**Never**

- `media.assets` SQL de outros BCs
- Imports internos fora de `assets/public.ts`

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
| Payment | `PaymentIntent` (quero pagar) ≠ `Payment` (gateway confirmou); `PaymentGateway` |
| Handoff | `CheckoutHandoffQuery` / `CheckoutHandoffDTO` (para Orders) |
| Validation | `CheckoutValidationPipeline` |
| Commands | `AddToCart`, `UpdateQuantity`, `MergeGuest/UserCart`, `StartCheckout`, `ConfirmPayment` |
| Events | `CheckoutStarted.v1`, `PaymentApproved.v1`, `InventoryConfirmed.v1`, `OrderCreated.v1` (handoff), `CheckoutCompleted.v1` |
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

---

## Orders

**Expose**

| Tipo | Símbolo |
|------|---------|
| Service | `OrdersService` / `createOrdersService` |
| Aggregate | `OrderAggregate` |
| Projections | `SellerOrdersProjection`, `BuyerOrdersProjection`, `DashboardProjection`, `RecentOrdersProjection` |
| Handoff consumer | `CreateOrderFromCheckoutProjection` |
| Events | `OrderCreated/Paid/Processing/Shipped/Delivered/Cancelled/RefundRequested/Refunded.v1` |
| Barrel | `orders/public.ts` |

**May call**

- `CheckoutHandoffQuery` (`checkout/public`) only
- ProjectionWorker, Outbox, DomainEventFactory

**Never**

```sql
SELECT * FROM checkout.sessions;
```

Listagens HTTP **somente** via projeções — nunca pelo Aggregate.
