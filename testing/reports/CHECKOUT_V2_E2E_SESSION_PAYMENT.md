# CHECKOUT_V2_E2E_SESSION_PAYMENT

**Gerado:** 2026-07-21T20:13:24Z  
**Verdict:** PASS (API)  
**Compra completa (confirm API)?** SIM  
**Compra browser FE produção?** NÃO (não validado neste run)

## Seed / listing

| Campo | Valor |
|-------|--------|
| Antes | `marketplace.listings` **inexistente**; legado `tcg_judge.card_listings` active+qty=8 (65 un.) |
| Depois | `marketplace.listings` active+qty>0 = **1** |
| listingId | `76ba13ac-6ef5-4ea0-a842-4858cb6c3a6c` |
| priceCents | 1000 |
| stockUnitId | `136154b4-da81-4d63-8edc-cef39dd0d0d9` |

Schema aplicado (idempotente): `marketplace.*`, `inventory.*`, `platform.sagas` / `saga_steps` / `domain_events`, `platform.idempotency_keys` (corrigido para contrato do handler).

## E2E HTTP

| Target | Resultado |
|--------|-----------|
| `http://127.0.0.1:8791` | **9/9 PASS** — session `payment_pending` + confirm `completed` |
| `https://checkout-v2-api.judgetcg.com.br` | **9/9 PASS** — mesmo fluxo (origem Cloudflare → API local neste run) |
| BFF `judgetcg.com.br/api/checkout-v2/cart` | **401** (proxy OK) |

### Evidência (público)

- sessionId: `bbc6eeb1-8819-4238-a05b-aa2973da0ea3`
- saga start: `a81de2be-56c0-4e04-b375-573aa9b0fce6`
- confirm saga: `829b18c9-6fe9-49e6-9e51-74af1ef4639e`
- totalCents: 1000 · clientSecret presente · status final: **completed**

Confirm usou `simulateSuccess=true` + `CHECKOUT_ALLOW_SIMULATE=1` (Stripe adapter). **Não** é captura real via Payment Element no browser.

## Gaps / ops

1. Hostname `checkout-v2-api.judgetcg.com.br` ainda via **Cloudflare** (não prova Render isolado). Apontar DNS/tunnel para o Web Service Render e repetir o E2E.
2. No Render: mesmo `DATABASE_URL`, secrets Stripe/MP/ME, e `CHECKOUT_ALLOW_SIMULATE=1` só se quiser confirm simulado.
3. FE browser full buy (UI checkout) ainda **não** fechado → release **NOT READY** para compra usuário final.

## Artefatos

- `testing/reports/checkout-v2-seed-listing-latest.json`
- `testing/reports/checkout-v2-e2e-session-payment-latest.json`
- `testing/ops/validate-checkout-v2-e2e.mjs`
- `services/api/scripts/_seed_checkout_v2_listing.ts`
