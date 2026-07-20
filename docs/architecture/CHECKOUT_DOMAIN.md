# Checkout BC V2

**Status:** Implementing (ADR-015)  
**Épico:** [CHECKOUT_BC_EPIC.md](./CHECKOUT_BC_EPIC.md)  
**Public API:** `services/api/src/checkout/public.ts`

## Capacidades

| Capacidade | Implementação |
|------------|----------------|
| Cart | `checkout.carts` / `checkout.cart_items` |
| Hold | `InventoryService.hold` (Saga step) |
| Pricing refresh | `PricingService.getValuation` |
| Cupom | `checkout.coupons` (percent / amount) |
| Payment Intent | `StubPaymentIntentAdapter` |
| Saga | `StartCheckout` via `SagaOrchestrator` |
| Events | `CheckoutStarted.v1`, `OrderCreated.v1` via Factory + Outbox |

## HTTP

Prefixo: `/api/v1/checkout-v2` (não colide com Order legado)

- `POST /cart` · `GET /cart/:id` · `POST /cart/:id/items` · `DELETE /cart/:id/items/:listingId`
- `POST /sessions` · `GET /sessions/:id`

Feature flag: `checkout_v2` (default OFF). CLI: `CHECKOUT_V2_FORCE=1 npm run checkout:start -- <buyerId> <cartId>`.

## Boundaries

Checkout **may** import: `marketplace/public`, `pricing/public`, `inventory/public`, platform saga/flags/outbox/events.

Checkout **must not** SQL em `marketplace.*`, `inventory.*`, `pricing.*`.
