# RC1 Final Readiness

**Data:** 2026-07-14  
**Parecer:** ❌ **RC1 BLOCKED**

## Critérios

| Critério | Lab | Prod | Status |
|---|---|---|---|
| Perf ≥95 `/` `/loja` `/checkout` cart comprador vendedor decks | PASS | PASS | PASS |
| Perf ≥95 `/loja/busca` | PASS (95) | **FAIL** (min **80**, flaky) | **FAIL** |
| A11y/BP/SEO =100 | PASS | PASS | PASS |
| LCP &lt;2s checkout | PASS | PASS (0.9s) | PASS |
| LCP &lt;2s busca (prod estável) | PASS | **FAIL** cold **2.2s** | **FAIL** |
| Smoke 34/34 | — | PASS (script local) | PASS\* |
| Security Scan | — | PASS | PASS |
| CI Vitest/QG | — | em recuperação | parcial |
| GitHub smoke workflow | — | FAIL 0s | FAIL\* |

\*Smoke de produto OK; workflow GH ainda quebrado (billing/arquivo).

## Decisão

Tag **RC1** **não** autorizada.
