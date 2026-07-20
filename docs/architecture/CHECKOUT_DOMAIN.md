# Checkout BC V2

**Status:** Sprint 1 — Cart / Coupon Rules / PaymentGateway / Validation  
**Épico:** [CHECKOUT_BC_EPIC.md](./CHECKOUT_BC_EPIC.md)  
**Public API:** `services/api/src/checkout/public.ts`

## Capacidades

| Capacidade | Implementação |
|------------|----------------|
| Cart Aggregate | `CartAggregate` — AddItem, RemoveItem, UpdateQuantity, Merge*, ValidateItems |
| Coupon Rules | `CouponEngine` + rules (fixed, %, free shipping, min, max uses, expiry, seller/marketplace, game/category) |
| Validation pipeline | Validators independentes → CreateSession |
| Hold | `InventoryService.hold` (Saga) |
| Pricing | `PricingService.getValuation` |
| Payment | `PaymentGateway` — create + confirm (Stub; Stripe/MP via adapter) |
| Confirm | Saga `ConfirmPayment`: gateway → `InventoryService.confirm` → completed |
| Events | `CheckoutStarted` → (`PaymentApproved`, `InventoryConfirmed`, `OrderCreated`, `CheckoutCompleted`) |

## HTTP

`/api/v1/checkout-v2` — cart CRUD, merge, validate, sessions, **confirm-payment**.

Feature flag: `checkout_v2` (default OFF).

## Boundaries

Checkout **may** import: `marketplace/public`, `pricing/public`, `inventory/public`, platform saga/flags/outbox/events.

Checkout **must not** SQL em schemas alheios.
