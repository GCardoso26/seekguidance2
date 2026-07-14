# PIPELINE RC FINAL

**Data:** 2026-07-14

| Gate | Resultado | Evidência |
|---|---|---|
| Build FE | PASS | `npm run build` |
| Type-check | PASS | tsc |
| Lint DS | PASS | `ds:audit` 0 |
| Vitest | PASS\* | path checkout corrigido (\*revalidar CI verde) |
| Pytest inventory | PASS | 13 unit |
| Ruff | PASS | `app tests evaluation` |
| Security Scan | PASS | TruffleHog |
| Smoke produto | PASS | 34/34 local |
| Smoke GH workflow | FAIL | 0s / billing |
| Lighthouse lab | PASS | ALL ≥95 |
| Lighthouse prod busca | **FAIL** | min Perf 80 |

**Pipeline completo ≠ verde** enquanto busca prod não estabilizar e smoke GH não executar.
