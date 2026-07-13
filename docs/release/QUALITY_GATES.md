# Quality Gates — RC1

**Commit:** `e6a3b884`  
**Ambiente de evidência:** local (Windows) + probes HTTPS prod  
**Data:** 2026-07-13

## Frontend (`frontend/runtime_console_v3`)

| Comando | Exit | Notas |
|---|---|---|
| `npm run type-check` | 0 | |
| `npm run lint` | 0 | 0 errors; ~61 warnings (não bloqueiam) |
| `npm run test` | 0 | 116 files, 387 tests |
| `npm run test -- tests/a11y` | 0 | 19 tests |
| `npm run ds:audit` | 0 | 0 hits |
| `NODE_OPTIONS=--max-old-space-size=8192 npm run build` | 0 | Next 15.5 |

## API

| Comando | Status | Notas |
|---|---|---|
| `pytest -q -m "not integration and not e2e and not smoke"` | CI remoto indisponível; suite completa longa | |
| `pytest tests/test_health.py + inventory unit` | **0** | 7 passed (subset RC1) |

## Smoke

| Comando | Exit | Notas |
|---|---|---|
| `python scripts/smoke_test.py` | 1 | API+Catalog OK; **BFF Health 503** |

## CI GitHub Actions

| Workflow | Status |
|---|---|
| CI / Quality Gates / Lighthouse / Playwright | **failure** — billing/spending limit |

## Política

Não mascarar: warnings ESLint permanecem; falhas smoke/CI registradas como blockers.
