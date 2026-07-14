# Event Operational Dashboards (Spec)

**Version:** 1.0.0  
**Status:** Architecture only — no chart UI in product app  
**Owner:** Platform

---

## Dashboard: Ingestion Ops

| Widget | Origin | Refresh | Priority |
|--------|--------|---------|----------|
| Events/min (persisted) | analytics_events | 1m | P0 |
| Error/min (lost + upstream) | logs / gateway | 1m | P0 |
| Persist vs DLQ rate | events + dlq | 1m | P0 |
| DLQ depth (pending) | analytics_events_dlq | 1m | P0 |
| Ingest latency P95 | lag created_at−timestamp | 5m | P0 |
| Top events by volume | analytics_events | 5m | P0 |
| Orphan/unknown (DLQ reason=unknown_event) | DLQ | 5m | P0 |
| Rejected by reason | DLQ group by reason | 5m | P0 |
| Events by schema version | analytics_events | 15m | P1 |
| Events by domain/category | join registry metadata | 15m | P1 |
| Analytics Health Score | AHS formula | 5m | P0 |
| Duplicates/min | ingest counters | 5m | P1 |

**Owner:** Platform Eng · **Data:** Postgres + API `ingestion-health`

---

## No product UI

Implement in Grafana/Metabase/Cloud logging — not marketplace React surfaces.
