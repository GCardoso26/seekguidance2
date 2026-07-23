# REGRESSION_REPORT

**Date:** 2026-07-22  
**Campaign:** Platform V4 QA Certification

## Executed regression subset

| Suite | Result |
|-------|--------|
| product-catalog vitest (all) | PASS |
| checkout vitest subset | PASS |
| architecture boundaries | PASS |
| PlatformV4 + Certification tests | PASS |
| tsc API + FE | PASS |

## Not executed (gap)

| Suite | Status |
|-------|--------|
| Full Playwright e2e (42 specs) | NOT RUN |
| pytest API | NOT RUN |
| Chaos / 8h continuous | NOT RUN |
| Persona visual campaigns | NOT RUN |

## Regressions detected in V4 surface

Não há regressão de testes unitários existentes.  
Há **regressão de produto/capacidade**: marketplace com 14k SKUs **não conecta** ao master catalog (0 links) — comportamento pior que o desenho V4 prometido (painel nunca monta).

## New coverage added

`PlatformV4Certification.test.ts` (6 tests) documentando gaps BUG-V4-006/009.

## Verdict

Unit regression: **PASS**.  
Platform capability regression vs V4 goals: **FAIL**.
