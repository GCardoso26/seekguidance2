# CHECKOUT_REPORT

**Gerado:** 2026-07-21T18:36:00Z  
**Compra completa?** **NÃO**

## Evidências

### Gateways live (PASS)
`validate-payment-shipping.mjs` → **33/33**  
Stripe PI · MP PIX QR/copia-cola · Melhor Envio 14 quotes production

### HTTP Checkout V2
| Path | Result |
|------|--------|
| `checkout-v2-api.judgetcg.com.br` health/cart/auth | PASS |
| `localhost:3000/api/checkout-v2/cart` | **401** PASS (env corrigido) |
| `judgetcg.com.br/api/checkout-v2/cart` | **502** FAIL BUG-0010 |

### Session / Order E2E
`marketplace.listings` active+qty>0 → **0 rows** — não há SKU para StartCheckout→OrderCreated nesta base.

## Confidence Checkout
**~55%** (adapters+cart HTTP) · jornada FE produção **0%**

## Bugs
- BUG-0010 P0 OPEN (Vercel env)
- BUG-0011/0012 CLOSED
