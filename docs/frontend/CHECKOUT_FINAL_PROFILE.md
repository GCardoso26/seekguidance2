# Checkout Final Profile — RC1 Finalization

**Data:** 2026-07-14  
**URL:** `https://judgetcg.com.br/checkout`  
**Preset:** Lighthouse Desktop  
**Antes (prod):** Performance **91** · LCP **2.0s** · A11y 100 · BP 100 · SEO 100 · CLS ~0

## Core Web Vitals (produção pré-fix)

| Métrica | Valor | Score LH | Nota |
|---|---|---:|---|
| TTFB | ~10 ms | 1 | Sem gargalo de servidor |
| FCP | 0.3 s | 1 | OK |
| LCP | **2.0 s** | 0.63 | **Principal drag do score** |
| SI | 0.3 s | 1 | OK |
| TBT | 60 ms | 1 | OK |
| CLS | 0.001 | 1 | OK |
| max-potential-FID / INP lab | 80 ms | 0.98 | OK (&lt;200 ms) |

## Waterfall / third-party

| Recurso | Transfer | Impacto |
|---|---:|---|
| Stripe controller + stripe.js + shared | **~800 KB+** | Unused JS / scripting se loaded |
| Framework chunk `ed9f2dc4` | ~212 KB | Shared floor |
| Font woff2 | ~48 KB | |

## Arquitetura medida

```
checkout/layout → CheckoutProviders
  SearchPlatformProvider + CartDrawerOnDemand + PWA
└─ page "use client" 100%
   ├─ MobileLayout → GlobalHeader (search, badges, ⌘K)
   ├─ CheckoutStripeIsland dynamic ✅
   └─ EnhancedPixCheckoutPanel dynamic ✅
```

## Causalidade (só evidência)

1. LCP 2.0s derruba Perf de ~100 → **91** (FCP/TBT/CLS já verdes).  
2. Página monólito client — H1 “Finalizar compra” espera hydrate do bundle + header.  
3. CheckoutProviders ainda monta Search + CartDrawer (não necessários no pagamento).  
4. Stripe já é lazy no island; risco residual se `default_method===stripe` auto-start.  
5. TTFB não é blocker.

## Plano de recuperação (pré-código)

| # | Ação | Evidência |
|---|---|---|
| 1 | CheckoutProviders mínimos (sem Search/CartDrawer) | Bundle/hydrate |
| 2 | Shell RSC H1 + island client | LCP texto |
| 3 | Header lean no checkout (sem GlobalSearchBar) | Main-thread |
| 4 | Dynamic Coupons/Escrow/CPF | Unused JS |
| 5 | Não alterar API/CQRS/regras | Guardrail |

## Metas

Performance **≥95** · LCP **&lt;2s** · CLS **&lt;0.05** · INP **&lt;200ms**
