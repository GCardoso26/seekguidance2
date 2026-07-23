# PAYMENT_VALIDATION_REPORT

**Gerado:** 2026-07-22T02:56:00Z  
**Verdict:** PASS (harness adapters) · **33/33**  
**Confidence Payment:** ~85% (live create/get; sem captura browser Elements / PIX pago real em UI)

## Stripe (Test)
| Case | Status | Detail |
|------|--------|--------|
| create PI | PASS | `pi_3TvqIFPOaBiXTc0j1ceDLi4t` requires_action |
| get PI | PASS | requires_action |
| confirm sem PM | PASS | requires_action (esperado) |
| invalid intent | PASS | null_or_handled |
| Stub approved/declined/refund/webhook dup/×10 | PASS | unit+stub matrix |

## Mercado Pago PIX (Test)
| Case | Status | Detail |
|------|--------|--------|
| create PIX | PASS | requires_action + copy + qr |
| copia-cola | PASS | payload `000201…` |
| get | PASS | requires_action |
| Stub expired / paid-after-expiry policy | PASS | stub last-write-wins documentado |

## Não cobertos nesta sprint
- Payment Element browser (aprovado/recusado/cartão inválido/timeout UI)
- Webhook Stripe/MP assinados em produção
- Refund live Stripe/MP
- PIX pago real em sandbox + webhook fora de ordem live

## Artefato
`testing/ops/validate-payment-shipping.mjs` exit 0
