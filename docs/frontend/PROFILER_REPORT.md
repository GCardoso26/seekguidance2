# Profiler Report — Sprint 18.5

**Data:** 2026-07-13  
**Método:** análise estática de árvore de hidratação + Lighthouse TBT/LCP (desktop) + revisão de `dynamic()`/`Suspense`

> React Profiler DevTools interativo não foi anexado a esta sessão (headless CI). Inferências abaixo são de build + Lighthouse + code review.

## Hotspots de hidratação

| Área | Problema | Mitigação aplicada |
|---|---|---|
| Root providers | Theme/Auth/Query/Cart/Search no first paint | `AppProviders` consolidado; PWA prompt `dynamic(ssr:false)` |
| Home `MarketplaceFirstLanding` | Client inteiro | Trending/Shops/Catalog `dynamic` + `Suspense` na page |
| `/loja` | Page era `"use client"` (CSR bailout) | **RSC** + isla searchParams |
| Command Palette | cmdk no grafo global | `dynamic` + render só com `open` |
| Card Detail | recharts + valuation no main | `dynamic(ssr:false)` |
| Seller dashboard | AI + drawer + reputation | `dynamic(ssr:false)` |

## Renders excessivos (candidatos)

| Componente | Nota |
|---|---|
| `MobileLayout` / bottom nav | Presente em quase todas rotas buyer — candidato a memo seletivo (não over-memoized nesta sprint) |
| `GameGrid` | Client; dentro de Suspense em `/loja` |
| `BuyerDashboardPage` | Já `dynamic(ssr:false)` |

## Métricas pós-mitigação (desktop LH)

| Página | TBT | LCP |
|---|---|---|
| `/` | 40 ms | 1.6 s |
| `/loja` | 40 ms | 2.5 s |
| `/checkout` | 20 ms | 1.5 s |
| `/vendedor/painel` | 50 ms | 1.0 s |

TBT <150 ms nas páginas auditadas. LCP home/checkout dentro da meta; `/loja` e `/loja/busca` ainda acima de 2.0 s.

## Follow-up

1. Profiler DevTools gravado em staging (export Chrome JSON).
2. Split do `MarketplaceFirstLanding` em hero RSC + islands.
3. Avaliar React Compiler no repo (se habilitado, evitar memo manual).
