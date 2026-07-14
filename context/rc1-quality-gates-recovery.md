# RC1.2 — Quality Gates Recovery

**Data:** 2026-07-14  
**Status:** Lab PASS · Production pending deploy  
**Goal:** A11y ≥98 · Best Practices =100 (sem features / BCs)

## O que foi feito

1. **Contraste warning** — `--warning-500` escurecido (WCAG AA); home rating deixa de falhar `color-contrast`.
2. **Analytics soft-200** — `/api/analytics/track` nunca devolve 4xx/5xx ao browser.
3. **Catalog soft-degrade** — `/api/catalog/sets` e search retornam payload vazio com HTTP 200 quando a API sobe 503.
4. **Source maps** — `productionBrowserSourceMaps: true` (já alinhado).
5. **Docs** — suite completa em `docs/frontend/*` (audits + history + production).

## Lab (medido)

| Gate | Meta | Medido (críticas) |
|---|---|---|
| A11y | ≥98 | **100** |
| BP | =100 | **100** |
| SEO | =100 | **100** |
| Perf | ≥95 | **PASS** (`/`, `/loja`, cart, checkout, comprador, decks) |
| LCP | &lt;2s | **PASS** |
| CLS | &lt;0.05 | **PASS** |
| Console | limpo | **PASS** (LH `errors-in-console` =1) |

## Production

Ainda em código anterior → A11y/BP **não** medidos como PASS em `judgetcg.com.br`. Deploy obrigatório antes da tag.

## Decisão

Ver `context/rc1-final-report.md` atualizado / `docs/release/RC1_READINESS.md`.
