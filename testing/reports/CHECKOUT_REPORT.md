# CHECKOUT_REPORT — AUDIT_PASS_2026-07-29

## Provas

| Check | Resultado |
|---|---|
| checkout-v2 `/health` | ok; postgres durable; outbox ok; workers ok; sprint 6 |
| API payments | **deferred** |
| OpenPix | disabled |
| Melhor Envio | disabled / sandbox / sem token |
| Stripe key presente | stripe=ok no health (≠ fluxo E2E) |
| PIX end-to-end | **não executado** |
| Idempotência / oversell / webhook | **não executado** |
| `certify:checkout:prod` | **não executado** |

## Veredito

Infra checkout-v2 **viva**, compra real **não certificada**.  
**Checkout READY = FALSE.**
