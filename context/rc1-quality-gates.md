# RC1 Quality Gates (blocker resolution)

**Data:** 2026-07-13  
**HEAD:** `fda702e2` (+ commits docs/smoke desta fase)

| Gate | Resultado | Evidência |
|---|---|---|
| type-check / lint / vitest / build / ds:audit | PASS (prévio S18) | RC1 final report |
| `test_redis_ping_without_url` | **PASS** | monkeypatch limpa `_redis_client` + delenv |
| pytest sprint6 module | 3 passed | local |
| BFF `/api/health` | **HTTP 200** | prod pós-deploy |
| Smoke prod | **34/34 PASS** | `context/rc1-smoke-report.md` |
| Lighthouse ≥95 all cats | **FAIL** | Perf 58–87 |
| GitHub Actions CI | **FAIL** | billing / spending limit |

## CI / Pipeline audit (Épico 1)

Workflows existem e estão corretos (`ci.yml`, `quality-gates.yml`, `lighthouse.yml`, `playwright.yml`).  
Jobs abortam em ~3s com anotação oficial:

> The job was not started because recent account payments have failed or your spending limit needs to be increased.

**Problema externo (billing).** Sem workaround inseguro. Owner: Ops GitHub.
