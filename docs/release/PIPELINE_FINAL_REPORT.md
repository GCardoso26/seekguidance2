# Pipeline Final Report — RC1

**Data:** 2026-07-14

| Check | Ambiente | Resultado |
|---|---|---|
| Build (Next) | local + Vercel | **PASS** |
| Type-check (`tsc`) | local | **PASS** |
| Lint (ESLint) | local | **PASS** (0 errors; warnings pré-existentes) |
| Vitest | local pós-fix a11y | **PASS** (387 após fix path checkout) |
| Ruff | local `app tests evaluation` | **PASS** |
| Pytest (sample payments/wishlist) | local | **PASS** 11 |
| Security Scan | GH Actions | **PASS** |
| Lighthouse CI | GH Actions | **PASS** |
| Lighthouse prod full battery | local→prod | **PASS** exit 0 |
| Smoke prod | `scripts/smoke_test.py` | **PASS 34/34** |
| CI frontend (pre-fix vitest path) | GH | FAIL → corrigido (push follow-up) |
| Quality Gates | GH | FAIL mesma causa → follow-up |

**Nota:** revalidar CI verde após commit do teste a11y.
