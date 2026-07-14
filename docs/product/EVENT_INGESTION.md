# Event Ingestion

**Version:** 1.0.0  
**Status:** Active  
**Owner:** Platform

---

## Happy path

```text
Frontend trackEvent (schema v1 + optional idempotency_key)
        ↓
localStorage queue
        ↓
POST /api/analytics/track  (Next gateway — soft HTTP 200, body truthful)
        ↓
POST /runtime/judge/analytics/track  (API 202)
        ↓
Validate name ∈ EVENT_REGISTRY
Validate schema version ∈ SUPPORTED
        ↓
INSERT analytics_events
        ↓
Response { ok, received, persisted, dead_lettered, duplicates, lost, ingest_trace_id }
```

---

## Failure path (no silent success)

```text
unknown | invalid version | invalid payload | persist error
        ↓
INSERT analytics_events_dlq
  (reason, payload, origin, ingest_trace_id, timestamp)
        ↓
Response still ok:true if lost==0 (event accounted in DLQ)
        ↓
Reprocess job (future) / manual ops
```

| Condition | HTTP browser | Body.ok | Client queue |
|-----------|--------------|---------|--------------|
| All persisted/DLQ/dup | 200 | true | clear |
| Any lost (DLQ table down / commit fail) | 200 | **false** | **keep** |
| Rate limit / bad JSON | 200 | false | keep |
| Upstream 5xx | 200 | false | keep |

**Soft HTTP 200** (RC1.2) is **not** silent success: integrity lives in `ok`/`lost`/`dead_lettered`.

---

## Response contract

```json
{
  "ok": true,
  "received": 3,
  "persisted": 2,
  "dead_lettered": 1,
  "duplicates": 0,
  "lost": 0,
  "ingest_trace_id": "uuid",
  "details": [{"event":"…","status":"persisted|dead_letter|duplicate|lost","reason":"…"}]
}
```

Backward compat: `received` = batch size. Prefer `persisted` for insert counts.

---

## Storage

| Table | Role |
|-------|------|
| `tcg_judge.analytics_events` | Valid registered events |
| `tcg_judge.analytics_events_dlq` | Rejected / unknown / persist_failed |

Migration: `supabase/migrations/20260714120000_beta15_event_integrity.sql`

---

## Observability

- Endpoint: `GET /runtime/judge/analytics/ingestion-health?hours=24`  
- Logs: `analytics_event_record_failed`, `analytics_dlq_insert_failed`, `analytics_event_duplicate`  
- Trace: `ingest_trace_id` on every batch
