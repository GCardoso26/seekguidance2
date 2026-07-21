# PAYMENT_VALIDATION_REPORT — Final Validation Sprint

**Gerado:** 2026-07-21T14:50:00Z  
**Status:** **FAIL** (gateways reais não exercitados)

## Ambiente (presença de secrets — sem valores)

Script: `node testing/ops/_check-secrets.mjs` (2026-07-21)

| Variável | Local `services/api/.env` | Local `frontend/.../.env.local` |
|----------|---------------------------|----------------------------------|
| STRIPE_SECRET_KEY | **MISSING** | — |
| MERCADOPAGO_ACCESS_TOKEN | **MISSING** | — |
| MELHOR_ENVIO_TOKEN | **MISSING** | — |
| CHECKOUT_PAYMENT_GATEWAY | **MISSING** | — |
| CHECKOUT_V2_API_URL | — | **MISSING** |
| NEXT_PUBLIC_CHECKOUT_V2 | — | **MISSING** (dev); Playwright process may set `1` |

**Nota:** Credenciais podem existir em Render/Vercel dashboard; **não** estão disponíveis neste runner → impossível provar Stripe Test / MP PIX Test live aqui.

## Executado

### Regressão Stub / contrato (Vitest)

```text
PaymentValidation.final.test.ts — 5/5 PASS
PaymentGateway.adapters.test.ts — 9/9 PASS
```

Cobertura: webhook duplicado (eventId), out-of-order stub, ConfirmPaymentIntent×10, PIX shape stub, Stripe adapter só constrói com key dummy.

### Legacy order certification (in-memory — **não** Checkout BC V2)

```text
npm run certify:checkout → PASSED (create_cart … webhook_paid … outbox_events)
```

Prova pipeline **Order** legado; **não** substitui PSP real no BC V2.

### Live Stripe / Mercado Pago

| Cenário | Resultado |
|---------|-----------|
| Pagamento aprovado | **NOT RUN** |
| Recusado + compensação | **NOT RUN** |
| Cartão inválido | **NOT RUN** |
| Timeout | **NOT RUN** |
| Webhook / refund / idempotência live | **NOT RUN** |
| PIX QR / copia-cola / expiração | **NOT RUN** |

## Outbox

- Chaos light: outbox retry após Redis indisponível → **PASS** (`chaos.light.test.ts`)
- Outbox pós-webhook Stripe/MP em produção de testes: **sem evidência**

## Bugs

- **BUG-0007** (P0): API Checkout V2 inacessível — pagamento V2 não alcançável via HTTP

## Confidence

**12%** (somente testes Stub/unit; critério sprint exige Stripe + MP PIX validados)
