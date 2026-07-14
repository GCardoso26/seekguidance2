# Event Platform Roadmap (post–integrity)

**Version:** 1.0.0  
**Status:** Ready-ground only  
**Prerequisite:** Analytics Health ≥ 75 sustained

Integrity platform unlocks — **does not implement** — the following:

| Capability | Why integrity first |
|------------|---------------------|
| Heatmaps | Need trusted session_id / page_view |
| Session Replay | Need ingest reliability + PII policy on DLQ |
| Experiment Engine | Exposure events must not drop |
| Feature Flag Analytics | Flag exposure ∈ registry |
| Anomaly Detection | Stable volume baselines |
| Daily Reports | NSM/KPI trust |
| AI Product Analyst | Cite only trusted marts |

### Immediate (apply now on current arch)

1. Run migration `20260714120000_beta15_event_integrity.sql`  
2. Monitor `ingestion-health` + DLQ reasons  
3. Wire Grafana widgets from EVENT_DASHBOARDS  
4. Keep CI registry parity green  

### Beta 2 prep (still no product features required)

- JSON Schema per P0 event (strict mode → DLQ)  
- DLQ reprocessor job  
- `context` required on checkout_*  
- Search.v1 required fields for zero-results KPI
