# CHECKOUT_V2_VERCEL_TUNNEL_VALIDATION

**Gerado:** 2026-07-21T16:20:00Z  
**Verdict:** **PASS** (9/9)

## Ambiente

| Item | Valor |
|------|--------|
| Tunnel | `https://optical-son-interpretation-paid.trycloudflare.com` |
| FE | `https://judgetcg.com.br` |
| API local | `127.0.0.1:8791` (atrás do tunnel) |

## Resultados

| Step | OK | Status | Detail |
|------|----|--------|--------|
| tunnel.health | PASS | 200 | ok |
| tunnel.cart.unauth_401 | PASS | 401 | unauthorized |
| tunnel.auth.register | PASS | 201 | user criado |
| tunnel.auth.login | PASS | 200 | token |
| tunnel.cart.create | PASS | 201 | cartId=69913803-... |
| tunnel.sessions.missing_cartId_400 | PASS | 400 | cartId_required |
| vercel.bff.apex.cart_unauth | PASS | **401** | proxy Vercel→tunnel OK |
| vercel.bff.www.cart_unauth | PASS | **401** | idem |
| vercel.bff.apex.cart_with_bearer | PASS | 401 | BFF só cookie até redeploy do fix Authorization |

JSON: `checkout-v2-vercel-tunnel-validation-latest.json`

## Comparação com rodada anterior

| Antes (localhost no Vercel) | Agora (tunnel) |
|-----------------------------|----------------|
| BFF → **500** | BFF → **401** |
| BUG-0008 bloqueava | Proxy público **funcionando** |

## Bugs

- **BUG-0008**: mitigado com tunnel (config correta). Mantém risco: URL quick-tunnel muda se reiniciar.
- BFF: patch local para encaminhar `Authorization` header — **exige redeploy Vercel** para valer em produção.

## Ainda NÃO validado

Pagamento Stripe/MP, frete Melhor Envio, session completa → OrderCreated, concurrency.

**Release Readiness:** ainda **NOT READY** para compra completa; gate de conectividade Vercel↔API Node = **PASS**.
