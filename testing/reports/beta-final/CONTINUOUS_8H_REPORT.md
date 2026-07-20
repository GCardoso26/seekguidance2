# CONTINUOUS_8H_REPORT

**Date:** 2026-07-20

## Harness

`testing/ops/continuous-8h-campaign.mjs`  
Flags: `CONTINUOUS_HOURS`, `CONTINUOUS_LOOP_MS`, `CONTINUOUS_SMOKE=1`

## Execução

| Run | Duração | Resultado |
|-----|---------|-----------|
| Smoke `HOURS=0.01` SMOKE=1 | ~37s | **Concluído com falhas** — Audit 67% (Console/API/Search blocking); Carlos Playwright falhou (EADDRINUSE webServer) |
| Full 8h | **NÃO EXECUTADO** | Ambiente instável |

Log: `testing/reports/continuous-8h/run-2026-07-20T19-48-03-942Z.jsonl`

## Critério sprint

Campanha 8h sem falhas críticas: **NÃO ATINGIDO**.

## Ação

1. Manter FE UP (`API_PROXY_TARGET` + chunks 200)  
2. `CONTINUOUS_SMOKE=0 CONTINUOUS_HOURS=8` supervisionado overnight
