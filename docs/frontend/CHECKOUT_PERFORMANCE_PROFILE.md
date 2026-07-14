# Checkout Performance Profile — RC1 Final

**Data:** 2026-07-14  
**URL:** `https://judgetcg.com.br/checkout`  
**Preset:** Lighthouse Desktop (bateria pós-deploy)  
**Score:** Performance **91** · A11y 100 · BP 100 · SEO 100

## Core Web Vitals / Lab

| Métrica | Valor | Score LH |
|---|---|---|
| TTFB (server-response-time) | **10 ms** | 1 |
| FCP | **0.3 s** | 1 |
| LCP | **2.0 s** | 0.63 ← principal drag |
| SI | **0.3 s** | 1 |
| TBT | **60 ms** | 1 |
| TTI | **2.0 s** | 0.96 |
| CLS | **0.001** | 1 |
| max-potential-FID | 80 ms | 0.98 |
| Bootup time | 0.3 s | 1 |
| Main-thread work | 0.7 s | 1 |

## Waterfall / third-party (maiores)

| Recurso | Transfer | Tipo |
|---|---:|---|
| `js.stripe.com/.../controller-with-preconnect-*.js` | **~354 KB** | Script 3P |
| `js.stripe.com/dahlia/stripe.js` | **~270 KB** | Script 3P |
| `js.stripe.com/.../shared-*.js` | **~193 KB** | Script 3P |
| `_next/.../ed9f2dc4-*.js` (framework) | ~212 KB | First-party |
| Stripe `pt-BR` locale JSON | ~52 KB | 3P |
| Font woff2 | ~48 KB | First-party |

**Boot scripting:** Stripe.js ~69 ms; shared React chunk ~140 ms.

## Unused JavaScript

Est. **468 KiB** wasted — destaque:

- framework chunk ~212 KB  
- **`stripe.js` ~183 KB**  
- outros chunks app ~70 KB  

## Cadeia de render / hidratação (código)

```
checkout/layout → MarketplaceProviders (UpgradeModal + Cart + Search + PWA)
└─ page ("use client") 100%
   ├─ loadStripe() NO TOP-LEVEL DO MÓDULO  ← eager Stripe
   ├─ MobileLayout / GlobalHeader
   ├─ Elements / PaymentElement (quando clientSecret)
   └─ EnhancedPixCheckoutPanel → PixStatusRealtime → canvas-confetti
```

## Diagnóstico (evidência)

1. **LCP 2.0s** é o audit que derruba Perf de ~100 → 91 (FCP/TBT/CLS já verdes).  
2. **Stripe carrega no parse do módulo** mesmo no fluxo PIX (`loadStripe` + imports `@stripe/*` estáticos). Network confirma ~800 KB+ de scripts Stripe no first load.  
3. Providers de marketplace incluem **UpgradeModal** eager no path de checkout.  
4. CartDrawer já é `dynamic(ssr:false)`, mas montado sempre no hydrate.  
5. TTFB não é gargalo (10 ms).

## Oportunidades priorizadas (pré-código)

| # | Mudança | Evidência | Risco negócio |
|---|---|---|---|
| 1 | Lazy Stripe só após escolha cartão / `clientSecret` | unused JS + network Stripe | Baixo |
| 2 | Providers mínimos no checkout (sem UpgradeModal) | bundle inicial | Baixo |
| 3 | Dynamic `EnhancedPixCheckoutPanel` (confetti fora do critical) | import chain | Baixo |
| 4 | CartDrawer mount-on-open | hydrate | Baixo |
| 5 | **Não** reescrever fluxo / API / CQRS | guardrail | — |

## Meta pós-fix

Performance **≥95** · LCP **&lt;2s** · CLS **&lt;0.05**
