# Checkout BC — Épico (próximo desenvolvimento)

**Status:** In progress (implementação iniciada)  
**Prioridade:** 🔴 Muito alta  
**Não começar** novos componentes transversais neste épico.

## Objetivo

Fluxo completo de negócio: carrinho → reserva → preço → cupom (simples) → Payment Intent → confirmação, **orquestrado por Saga**, eventos via **Outbox**.

## Domínio

Ver [CHECKOUT_DOMAIN.md](./CHECKOUT_DOMAIN.md).

## Consumidores permitidos (somente Public API)

```text
MarketplaceOrchestrator / marketplace/public
PricingService           / pricing/public
InventoryService         / inventory/public  (hold | confirm | release)
SagaOrchestrator
FeatureFlagService       (checkout_v2)
DomainEventFactory
Outbox (via Application Service na mesma TX)
```

## Proibido

```sql
SELECT * FROM marketplace.listings;
UPDATE inventory.stock_units …;
SELECT * FROM pricing.…;
```

Importar `*/persistence/*` de outro BC.

## Capacidades V1

| Capacidade | Notas |
|------------|--------|
| Cart | Itens por `listingId` / `productVariantId` |
| Inventory hold | `InventoryService.hold` na Saga |
| Price refresh | `PricingService` (suggested / snapshot) |
| Coupons | Stub ou regras mínimas (sem motor complexo) |
| Payment Intent | Adapter (Stripe já existe no monorepo — não reinventar) |
| Checkout Saga | Steps + compensate (release stock) |
| Events | `CheckoutStarted.v1`, `InventoryReserved.v1`, `OrderCreated.v1` (via Factory + Registry) |

## Saga (esboço)

```text
ValidateCart
  → HoldInventory
  → RefreshPricing
  → ApplyCoupon
  → CreatePaymentIntent
  → PersistCheckoutSession
  → EmitCheckoutStarted (Outbox)
```

Falha → compensate `InventoryService.release`.

## DoD do épico

Ver [DEFINITION_OF_DONE.md](../engineering/DEFINITION_OF_DONE.md).  
Atualizar `PUBLIC_API_BOUNDARIES.md` com seção Checkout **Expose** ao final.

## Fora de escopo (V1)

- Fulfillment / labels
- Event Store completo
- Motor fiscal completo
- Multi-moeda avançada
