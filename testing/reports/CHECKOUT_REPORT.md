# CHECKOUT_REPORT

**Gerado:** 2026-07-22T06:55:00Z  
**Upstream:** `https://seekguidance2-66dz.onrender.com`  
**FE BFF:** `https://judgetcg.com.br/api/checkout-v2/*`  
**Status:** **FAIL** para Beta · Confidence **55%**

## Matriz

| Check | Resultado | Evidência |
|-------|-----------|-----------|
| Health | 200 ok | Mas `postgres/redis/meilisearch: **in_memory**` → **P0** |
| BFF prod → Render | 401 cart | Upstream header/wiring OK |
| Auth | PASS | register/login |
| Cart + add listing | PASS | listing seed |
| Session card | PASS | `payment_pending` + Stripe `pi_` + `clientSecret` |
| Confirm sem pagar | Esperado | `payment_not_succeeded:requires_action` |
| Session PIX | **FAIL** | Stripe PIX não ativado |
| Confirm ×10 simulateSuccess | PASS status | 10× `completed` |
| UI Elements / QR / timeout / expiração | **NÃO** | Sem browser E2E |
| Webhook pago real | **NÃO** | Só liveness parse fail |
| OrderCreated / CheckoutCompleted | **NÃO** | Sem prova durável |
| Collection invalidation | **NÃO** | |
| Profile refresh | **NÃO** | |

## Veredito

Checkout V2 **conectado** e card **até clientSecret**, mas **não READY** (persistência in_memory + PIX + E2E incompleto).
