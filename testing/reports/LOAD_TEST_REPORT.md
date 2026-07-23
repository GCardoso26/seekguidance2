# LOAD_TEST_REPORT

**Date:** 2026-07-23  
**Script:** `services/api/scripts/load-probe-v6.ts`  
**Base:** `https://judgetcg.com.br`  
**Paths:** `/loja`, `/marketplace/produtos`, `/checkout`, `/`

## Stages

| Users | OK | Fail | P50 | P95 | P99 | Mean |
|------:|---:|-----:|----:|----:|----:|-----:|
| 100 | 100 | 0 | 195 | 539 | 559 | 247 |
| 250 | 250 | 0 | 126 | 561 | 658 | 210 |
| 500 | 500 | 0 | 81 | 131 | 242 | 87 |
| 1000 | 1000 | 0 | 115 | 361 | 501 | 152 |

Thresholds: fail rate <5%, P95 <8000ms.

## Verdict

**PASS** — 100→1000 concurrent GET batches, 0 failures, P95 ≤561ms.
