# Store Search Performance Profile — `/loja/busca`

**Data:** 2026-07-14  
**URL:** `https://judgetcg.com.br/loja/busca`  
**Preset:** Lighthouse Desktop  
**Score:** Performance **86** · A11y 100 · BP 100 · SEO 100

## Core Web Vitals / Lab

| Métrica | Valor | Score LH |
|---|---|---|
| TTFB | **~0 ms** | 1 |
| FCP | **0.3 s** | 1 |
| LCP | **2.1 s** | 0.61 ← principal drag |
| SI | **1.8 s** | 0.71 |
| TBT | **100 ms** | 0.97 |
| TTI | **2.1 s** | 0.95 |
| CLS | **0** | 1 |
| max-potential-FID | 150 ms | 0.85 |
| Bootup time | 0.5 s | 1 |
| Main-thread work | **1.9 s** | — |

## Waterfall (maiores first-party)

| Recurso | Transfer | Nota |
|---|---:|---|
| `ed9f2dc4-*.js` (React/Next) | ~212 KB | floor shared |
| `31255-*.js` | ~64 KB | scripting alto |
| `4bd1b696-*.js` | ~55 KB | scripting ~178 ms |
| font woff2 | ~48 KB | |
| `/api/catalog/sets` | ~13 KB | fetch facetas |

Sem Stripe nesta rota.

## Unused JavaScript

Est. **285 KiB** (quase só shared/framework — não third-party checkout).

## Arquitetura atual

```
loja/layout → StoreProviders (Search + CartDrawer lazy + PWA)
loja/busca/page.tsx → "use client" 100%
  └─ MobileLayout + FacetedSearch
       ├─ SearchFiltersPanel (Radix Dialog)
       ├─ CardGrid + @tanstack/react-virtual
       ├─ QuickViewModal (estático no grafo)
       └─ useCardSearch / useCatalogSets (RQ)
```

**Ausente:** GameGrid, UpgradeModal, Stripe.

## Diagnóstico

1. Página inteira é **client** — hero/H1 não é RSC estático (diferente de `/loja` hub).  
2. LCP/SI sofrem com main-thread ~1.9s + hidratação de FacetedSearch/filtros/grid.  
3. TTFB OK; network de catálogo é pequeno vs JS.  
4. CartDrawer chunk carrega no hydrate mesmo fechado.

## Oportunidades priorizadas

| # | Mudança | Evidência |
|---|---|---|
| 1 | `page.tsx` RSC: shell H1 estático + island `FacetedSearch` (como `/loja`) | LCP/SI |
| 2 | `dynamic` FacetedSearch / QuickViewModal | unused JS / main-thread |
| 3 | CartDrawer mount-on-open | hydrate |
| 4 | Sem virtualização rewrite / sem novas features | guardrail |

## Meta pós-fix

Performance **≥95** · LCP **&lt;2s** · CLS **&lt;0.05**
