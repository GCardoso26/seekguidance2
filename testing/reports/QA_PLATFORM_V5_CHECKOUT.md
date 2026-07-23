# QA_PLATFORM_V5_CHECKOUT

**Date:** 2026-07-23  
**Verdict:** **FAIL**

## Evidence

| Check | Result |
|-------|--------|
| Vitest checkout/payment adapters | PASS (incl. MP throws without token) |
| `CHECKOUT_PAYMENT_GATEWAY` | **stub** |
| Stripe secret | **MISSING** |
| Mercado Pago token | **MISSING** |
| Melhor Envio | **MISSING** |
| Live PIX / Stripe / MP / webhooks / refund | **NOT_EXECUTED** |
| Inventory lock / concurrency live | NOT_EXECUTED |
| `cart.carts` | 0 |
| `payment.payments` table exists | yes (schema) |

## Findings
- BUG-V5-001: impossível certificar PSP live.  
- Código de gateway existe; **existência ≠ funcionamento live** (política).

## Gate
Checkout **não validado**.
