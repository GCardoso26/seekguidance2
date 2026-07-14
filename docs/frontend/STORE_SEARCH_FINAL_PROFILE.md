# Store Search Final Profile — RC1 Finalization

**Data:** 2026-07-14  
**URL:** `https://judgetcg.com.br/loja/busca`  
**Preset:** Lighthouse Desktop  
**Antes (prod):** Performance **86** · LCP **2.1s** · A11y 100 · BP 100 · SEO 100 · CLS 0

## Core Web Vitals (produção pré-fix)

| Métrica | Valor | Score LH | Nota |
|---|---|---:|---|
| TTFB | ~0 ms | 1 | OK |
| FCP | 0.3 s | 1 | OK |
| LCP | **2.1 s** | 0.61 | **Principal drag** |
| SI | 1.8 s | 0.71 | Sofre main-thread |
| TBT | 100 ms | 0.97 | Aceitável |
| CLS | 0 | 1 | OK |
| Main-thread work | **1.9 s** | — | Hydrate FacetedSearch |

## Waterfall first-party

| Recurso | Transfer | Nota |
|---|---:|---|
| Framework `ed9f2dc4` | ~212 KB | Floor |
| `31255` / `4bd1b696` | ~64 / ~55 KB | Scripting |
| Font woff2 | ~48 KB | |
| `/api/catalog/sets` | ~13 KB | Facetas |

Sem Stripe nesta rota.

## Arquitetura medida

```
loja/layout → StoreProviders
loja/busca/page.tsx → RSC shell (H1) + Suspense
  └─ LojaBuscaClient → dynamic FacetedSearch (ssr:false)
       ├─ SearchFiltersPanel (eager no chunk)
       ├─ CardGrid: priority={index < 8} ← compete com LCP
       └─ Virtualização só gallery > 48
```

## Causalidade

1. H1 RSC já existe — mas **até 8 imagens priority** disputam LCP após island.  
2. Main-thread 1.9s: hydrate FacetedSearch + filtros + grid completo.  
3. Header em `/loja/*` monta GameMegaMenu + GlobalSearchBar.  
4. TTFB / network catálogo não são o bottleneck.

## Plano de recuperação (pré-código)

| # | Ação | Evidência |
|---|---|---|
| 1 | Reduzir `priority` images para 1–2 | LCP contention |
| 2 | Dynamic `SearchFiltersPanel` / sidebar | Main-thread |
| 3 | Dynamic GameMegaMenu no header | First paint `/loja` |
| 4 | Sem rewrite de busca / facetas | Guardrail |

## Metas

Performance **≥95** · LCP **&lt;2s** · CLS **&lt;0.05**
