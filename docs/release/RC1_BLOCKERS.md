# RC1 Blockers

**Data:** 2026-07-14 (RC final)  
**Status:** **ALL BLOCKERS RESOLVED**

## Resolvidos nesta finalização

| ID | Resolução | Evidência |
|---|---|---|
| PROD-CHECKOUT-PERF/LCP | Lazy Stripe + RSC shell + CheckoutProviders | Prod **P99 / LCP 0.8s** |
| Busca Perf | RSC shell + dynamic facets + defer sets | Prod **P97 / LCP 1.1s** |
| CI-API / Ruff | fix E501/E741/F841 + `--fix` | `ruff` PASS |
| CI-SECURITY | TruffleHog before/after SHAs | Security Scan **success** |
| Vitest a11y path | update path checkout | local PASS |

## Tag

Aprovado para criar tag **`RC1`** e GitHub Release (sem alterar critérios).
