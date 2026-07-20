# Beta Readiness Sprint — Progress Report

**Date:** 2026-07-20  
**Decisions:** 1B (Stripe+MP sandbox; skeletons demais) · 2A (FE → Checkout V2)

## Completed in this implementation wave

### Fase 0 — Checkout V2 payments
- Port `PaymentGateway` estendido: PIX, refund, parseWebhook
- `StubPaymentGateway`: PIX QR/copia-e-cola, webhook, refund, confirm idempotente
- `StripePaymentGateway` + `MercadoPagoPaymentGateway` (REST, sem SDK acoplado ao Checkout)
- Skeletons: Asaas / PagSeguro / Pagar.me
- `ConfirmPaymentSaga`: **compensate** em ConfirmGatewayPayment (refund+release) e InventoryConfirm
- `CheckoutService.expireSession` → `CheckoutExpired.v1` (Outbox)
- `CheckoutService.handlePaymentWebhook` → ConfirmPayment idempotente
- HTTP: `POST .../webhooks/:provider`, `POST .../sessions/:id/expire`, `paymentMethod` + `pix` no start
- Migration: `20260720230000_checkout_expired_pix.sql`
- EventRegistry: `CheckoutExpired.v1`, `PaymentRefunded.v1`
- Tests: `PaymentGateway.adapters.test.ts` — **12 passed**

### Fase 1 (parcial) — FE + Carlos
- BFF Next: `/api/checkout-v2/[...path]`
- Client: `src/lib/checkout-v2.ts` (`NEXT_PUBLIC_CHECKOUT_V2=1`)
- Playwright: `e2e/specs/buyer-lifecycle.spec.ts` → evidências `testing/reports/persona-carlos/`
- Runner Carlos: executa E2E (confidence parcial ~72% quando PASS)

### Fase 2 (parcial) — Frete
- Port `ShippingProvider` + Stub + skeletons (Melhor Envio/Correios/Jadlog/Kangu)
- Export em `checkout/public.ts`

### Fase 5 (harness)
- `testing/ops/continuous-8h-campaign.mjs` (`CONTINUOUS_HOURS=8`)

## Pending (próximas waves)
1. Ligar `CheckoutClient` UI ao fluxo V2 quando flag ON (hoje client/lib pronto; island legado ainda default)
2. Habilitar `checkout_v2` flag no DB local/staging + API Node UP para proxy
3. Carlos E2E sem mocks até confirm PIX/card real (meta confidence ≥95%)
4. Melhor Envio adapter real no port (hoje skeleton)
5. KYC/Favorites/Selados gaps
6. Testes chaos/recovery/saga falha InventoryConfirm com DB
7. Executar campanha 8h supervisionada
8. Orchestrator → Release Readiness READY

## How to validate now
```bash
cd services/api && npm run test -- src/checkout/__tests__/PaymentGateway.adapters.test.ts
# FE
set NEXT_PUBLIC_CHECKOUT_V2=1
# Carlos
node testing/personas/runners/carlos-buyer-stub.mjs
# 8h harness smoke
set CONTINUOUS_HOURS=0.05 && node testing/ops/continuous-8h-campaign.mjs
```

## Env keys (sandbox)
- `CHECKOUT_PAYMENT_GATEWAY=stub|stripe|mercado_pago`
- `STRIPE_SECRET_KEY`, `STRIPE_CHECKOUT_WEBHOOK_SECRET`
- `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`
- `NEXT_PUBLIC_CHECKOUT_V2=1`
- `CHECKOUT_V2_API_URL` (Node API hosting `/api/v1/checkout-v2`)
