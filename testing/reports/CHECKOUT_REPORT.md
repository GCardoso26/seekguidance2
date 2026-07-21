# CHECKOUT_REPORT — pós Vercel + Cloudflare Tunnel

**Gerado:** 2026-07-21T16:20:00Z  
**Compra completa?** **NÃO**  
**Conectividade Vercel ↔ API Node?** **SIM**

## Evidência

Smoke `validate-checkout-v2-vercel.mjs` → **9/9 PASS**

- Tunnel: health 200, register/login, cart **201**
- `https://judgetcg.com.br/api/checkout-v2/cart` → **401** (antes era 500 com localhost)
- `https://www.judgetcg.com.br/api/checkout-v2/cart` → **401**

Detalhe: [CHECKOUT_V2_VERCEL_TUNNEL_VALIDATION.md](./CHECKOUT_V2_VERCEL_TUNNEL_VALIDATION.md)

## Patch BFF (local, aguarda deploy)

`checkout-v2/[...path]/route.ts` agora encaminha header `Authorization` (além do cookie). Sem redeploy Vercel, bearer direto no BFF ainda cai em 401.

## Confidence Checkout

~**45%** (conectividade + cart; sem pagamento/pedido)

## Release

**NOT READY** — falta Stripe/MP/frete/fluxo completo.
