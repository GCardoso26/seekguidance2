# RC1.1 — Store Performance Recovery

**Data:** 2026-07-14  
**Escopo:** somente `/loja` performance / assets / RSC — sem features, APIs, BCs, design system visual.

## Resultado Store (medido lab desktop)

| Métrica | Antes | Depois |
|---|---|---|
| Performance | 74 | **97–98** |
| LCP | 4.2s | **1.2–1.3s** |
| CLS | 0 | **0** |
| SEO | 100 | **100** |
| A11y | 93 | **96** |
| BP | 96 | **96** |
| Shared JS | 341 KB | **341 KB** |

## O que desbloqueou o LCP

Evidência LH network: logos SVG via `/_next/image` transferiam até **1.5 MB**.  
Correção: WebP 128px (2–4 KB) + grid RSC + `StoreProviders` leves.

## Entregáveis

Ver `docs/frontend/STORE_*.md` e `SHARED_BUNDLE_ANALYSIS.md`.

## Parecer RC1

**RC1 BLOCKED** — Store Perf/LCP/CLS/SEO **PASS**; A11y **96&lt;98** e BP **96≠100** ainda falham o DoD estrito deste recovery + meta enterprise RC.
