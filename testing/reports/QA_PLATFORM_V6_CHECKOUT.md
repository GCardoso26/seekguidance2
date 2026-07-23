# QA_PLATFORM_V6_CHECKOUT

**Verdict:** **PARTIAL / FAIL gate completo**

## PASS (evidência)
- Gateway env: `CHECKOUT_PAYMENT_GATEWAY=stripe` (não stub após dotenv)
- Stripe: create/get PI, confirm without PM ≠ succeeded, invalid intent handled
- Mercado Pago PIX: create com `pixCopy` + QR; get intent
- Melhor Envio: quotes produção (14 modalidades)

Script: `services/api/scripts/_run_pay_ship_live.ts` → EXIT 0

## NOT_EXECUTED (bloqueia aprovação total)
- Webhooks Stripe/MP
- Refund
- Inventory lock + Order Saga + compensação
- Concorrência / idempotência full matrix
- Checkout UI E2E Carlos ponta a ponta

## Gate
PSP **API live OK**; checkout **plataforma completo NÃO**.
