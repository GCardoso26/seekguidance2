# Event Testing Strategy

**Version:** 1.0.0  
**Status:** Active  
**Owner:** Platform + QA

---

## Test types

| Type | What | Where |
|------|------|-------|
| Schema validation | version + envelope | `test_event_integrity.py` + future JSON Schema |
| Payload validation | properties object; critical fields | unit + contract |
| Contract tests | FE union ⊆ BE registry | `test_registry_covers_frontend_surface` |
| Backward compatibility | missing version → v1 | unit |
| Idempotency | duplicate key → duplicates++ | integration (post-migration) |
| Replay | DLQ reprocess inserts once | ops runbook + future job test |
| DLQ | unknown → dead_lettered, lost=0 | unit (done) |
| Event Registry | unique names, owners | unit |
| FE/BE parity | CI gate on registry vs FE list | pytest |
| Gateway | soft-200 + ok:false keeps queue | vitest analytics |
| Ingestion health | endpoint returns counts | API test (optional) |

---

## Mandatory before new event ships

1. Registry entry  
2. FE type (if client)  
3. Doc row  
4. Unit/contract test update  
5. Manual or automated emit → persisted check  

---

## Commands

```bash
# API
cd services/api && python -m pytest tests/judge/test_event_integrity.py -q

# FE SDK
cd frontend/runtime_console_v3 && npx vitest run tests/lib/analytics.test.ts
```
