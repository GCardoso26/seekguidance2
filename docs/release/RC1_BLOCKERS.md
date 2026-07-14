# RC1 Blockers

**Data:** 2026-07-14 (pós RC1.2 lab)  
**Escopo:** critérios para **tag** RC1

## Resolvidos (lab medido)

| ID | Was | Resolução |
|---|---|---|
| B2 | BFF health 503 | HTTP 200 (prévio) |
| B3 | Smoke FAIL | 34/34 (prévio) |
| Store Perf / LCP | 74 / 4.2s | RC1.1 → Perf 97–98 / LCP ~1.3s |
| A11y lab | 96 | RC1.2 → **100** |
| BP lab | 96 | RC1.2 → **100** (`errors-in-console` limpo) |

## Abertos (impedem tag)

| ID | Sev | Descrição | Evidência |
|---|---|---|---|
| B1 | P0 | GitHub Actions billing / spending limit | Jobs cortados no CI remoto |
| **PROD-LH** | **P0** | Production ainda sem deploy RC1.1+RC1.2 — A11y/BP/Perf Store **não** validados em `judgetcg.com.br` | `PRODUCTION_VALIDATION.md` (artefatos pré-fix) |

## Abertos (não bloqueiam se policy relaxar lab-only)

| ID | Sev | Descrição |
|---|---|---|
| B4 | P1 | Staging E2E flags |
| B6 | P2 | `shipping_v2` BE/FE mismatch |
| Busca Perf lab | P2 | `/loja/busca` Perf **86** (fora da lista crítica P1-6; A/BP/SEO 100) |

## Critério tag RC1

**Ainda não satisfeito:** B1 + **re-LH production** após deploy.

Status: blockers de quality gate **lab** resolvidos; **não** “All blockers resolved” para tagging até prod + CI.
