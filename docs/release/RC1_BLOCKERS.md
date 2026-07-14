# RC1 Blockers

**Data:** 2026-07-14 (RC finalization — evidência revalidada)  
**Status:** **NOT ALL BLOCKERS RESOLVED**

## Resolvidos (com evidência)

| ID | Resolução | Evidência |
|---|---|---|
| PROD-CHECKOUT-PERF/LCP | RSC shell + CheckoutProviders lean + header checkout | Prod **P99 / LCP 0.9s** (bateria independente) |
| CI-SECURITY | TruffleHog `before`→`sha` | Security Scan **success** |
| Ruff API | `ruff check app tests evaluation` | **PASS** local + CI |
| Vitest checkout path | `app/checkout/page.tsx` | Corrigido |
| Smoke prod | `scripts/smoke_test.py` | **34/34** local contra produção |
| Lab Perf críticas | LH desktop localhost | ALL ≥95 (incl. busca 95) |

## Aberto (impede tag)

| ID | Sev | Descrição | Evidência |
|---|---|---|---|
| **PROD-BUSCA-PERF** | P0 | `/loja/busca` Performance **instável** em produção (cold/warm) | runs: **80 / 92 / 94 / 95 / 97** — **min 80 &lt; 95** |
| **CI-SMOKE-WF** | P1 | Workflow `smoke-test.yml` falha em **0s** (“workflow file issue” / billable vazio) — billing/Actions | GH runs `29336858646` etc. Smoke **manual** PASS |

## Tag

**Não** criar `RC1` enquanto `/loja/busca` production Perf não for **≥95 de forma estável** (mínimo de 3 runs frios/quentes).
