# RC1 Blockers — atualizado

**Data:** 2026-07-13 (blocker resolution)  
**Commit health:** `fda702e2`

## Resolvidos

| ID | Was | Resolução |
|---|---|---|
| B2 | BFF `/api/health` 503 | Deploy health fix → **HTTP 200** |
| B3 | Smoke FAIL | Harness + health → **34/34** |
| P2 redis | `test_redis_ping_without_url` | monkeypatch `_redis_client` |

## Abertos (impedem tag)

| ID | Sev | Descrição | Evidência |
|---|---|---|---|
| B1 | P0 | GitHub Actions billing / spending limit | Jobs ~3s, annotation payments failed |
| B5 | P1→P0 critério | Lighthouse Performance 58–87 (&lt;95) | `context/rc1-lighthouse-report.md` |

## Abertos (não P0 tag se policy relaxar)

| ID | Sev | Descrição |
|---|---|---|
| B4 | P1 | Staging E2E flags não executado end-to-end (runbook OK) |
| B6 | P2 | BE `shipping_v2:false` vs FE `true` |

## Critério tag RC1

Ainda **não** satisfeito: B1 + B5 abertos.
