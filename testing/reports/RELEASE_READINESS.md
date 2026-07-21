# RELEASE_READINESS

**Overall: NOT READY**

**Campanha:** Checkout V2 Final Validation Sprint · **INTERROMPIDA**  
**Gerado:** 2026-07-21T18:36:00Z

## Pergunta central

> Um comprador consegue concluir uma compra completa no Checkout V2 sem problemas críticos?

**Resposta: NÃO**

### Bloqueio que interrompe READY

| ID | Pri | Issue |
|----|-----|--------|
| **BUG-0010** | **P0** | BFF produção `judgetcg.com.br/api/checkout-v2` → **502**; API pública OK |
| — | — | Sem listings `active`+qty>0 no DB → session/pay E2E bloqueado |
| — | — | Concurrency 2 buyers **SKIPPED** |
| — | — | Chaos/Recovery full **não** executados |

## O que PASS nesta rodada

| Item | Evidência |
|------|-----------|
| Ricardo audit | **100%** |
| API Node + tunnel | health **200** |
| Payment/Shipping live harness | **33/33 PASS** (Stripe PI, MP PIX QR, ME 14 cotações) |
| BFF **local** após fix env | **401** (proxy correto) |
| Carlos pages | confidence **72%** |
| Vitest checkout+chaos light | **34/34 PASS** |

## Critérios READY

| Critério | OK? |
|----------|-----|
| Buyer ≥95% | **NO** (72%) |
| Checkout ≥95% | **NO** (~55% — gateways live, sem compra E2E) |
| FCS ≥95% | **NO** |
| Nenhum P0 | **NO** — BUG-0010 |
| Nenhum P1 | ver KB |
| Stripe / MP PIX / Melhor Envio live | **YES** (harness adapters) |
| Concurrency / Chaos / Recovery PASS | **NO** |

**Release Readiness ≠ READY**

## Ação imediata

No **Vercel** (Production + Preview):

```env
CHECKOUT_V2_API_URL=https://checkout-v2-api.judgetcg.com.br
NEXT_PUBLIC_CHECKOUT_V2=1
```

Redeploy → `curl -X POST https://judgetcg.com.br/api/checkout-v2/cart` deve retornar **401**.  
(Local já validado com essa URL.)
