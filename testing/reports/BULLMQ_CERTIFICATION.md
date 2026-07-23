# BULLMQ_CERTIFICATION

**Date:** 2026-07-23  
**Script:** `services/api/scripts/certify-bullmq.ts` (`npm run certify:bullmq`)

## Environment

| Item | Value |
|------|-------|
| Host Redis 3.0.504 (Windows service :6379) | **INCOMPATIBLE** with BullMQ (≥5) |
| Redis used | **5.0.14.1** portable @ `127.0.0.1:6380` |
| `REDIS_URL` | `redis://127.0.0.1:6380/0` |
| Workers wiring | `registerProductCatalogWorkers.ts` + `BULLMQ_WORKERS=1` |

## Live results

```json
{
  "ok": true,
  "version": "5.0.14.1",
  "checks": [
    { "id": "redis_ping", "ok": true },
    { "id": "enqueue_sleeves", "ok": true, "detail": "jobId=1" },
    { "id": "worker_consume", "ok": true, "ms": 87 },
    { "id": "delayed_job", "ok": true, "ms": 1117 },
    { "id": "dlq_move", "ok": true, "detail": "failState=failed dlqWaiting=1" },
    { "id": "priority_enqueue_consume", "ok": true },
    { "id": "enqueue_helper", "ok": true }
  ]
}
```

## Coverage

| Capability | Result |
|------------|--------|
| Redis PING | PASS |
| Enqueue | PASS |
| Worker consume | PASS (~87ms) |
| Delayed jobs | PASS |
| Retry → failed | PASS |
| DLQ move | PASS |
| Priority | PASS |
| Backoff options | DEFAULT attempts=5 exponential 2s |

## Verdict

**PASS** — Redis 5 + BullMQ enqueue/consume/DLQ/delayed/priority certified live.  
**Ops note:** Production must not use Windows Redis 3.x; use Redis ≥6.2 (recommended) / ≥5.
