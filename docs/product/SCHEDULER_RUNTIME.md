# SCHEDULER_RUNTIME.md

**Version:** 1.0.0  
**Module:** `analytics_runtime.scheduler`

| Job | Interval |
|-----|----------|
| near_realtime | 60s |
| every_5m | 300s |
| hourly | 3600s |
| daily | 86400s |

Each run records: duration_ms, rows, ok/fail, retries.  
Ops: `POST /runtime/analytics/tick?force=true`.
