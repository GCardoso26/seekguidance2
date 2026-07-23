# QA_PLATFORM_V5_OPERATIONS

**Date:** 2026-07-23  
**Verdict:** **FAIL**

## Evidence

| Check | Result |
|-------|--------|
| Provider registry | 89 |
| Sync runs | **79 failed / 0 success** |
| Sync error sample | `image:…:fetch failed` |
| Outbox events rows | 27 |
| BullMQ queues/retry/DLQ live | NOT_EXECUTED |
| Redis / Qdrant / R2 / CDN health | NOT_EXECUTED |
| Deploy / rollback drill | NOT_EXECUTED |
| Workers health | inferível só via sync failures |

## Findings
- Scheduler “roda” mas **falha sistematicamente** no fetch de imagens (BUG-V5-004).  
- Ops Renato **não aprovável**.

## Gate
Operations **não validado**.
