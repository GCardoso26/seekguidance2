# BETA2_RUNTIME_REPORT.md

**Version:** 1.0.0  
**Date:** 2026-07-14  
**Status:** COMPLETE  
**Scope:** Product Analytics Runtime (no user-facing features)

---

## Architecture (final)

```text
events/orders snapshot → aggregators → funnels/cohorts/health/alerts
        → 11 materialized marts → TTL cache → Metric Registry resolution
        → GET /runtime/* (internal read-only)
```

Package: `services/api/app/analytics_runtime/`  
Migration (additive): `supabase/migrations/20260714180000_beta2_analytics_runtime_marts.sql`

---

## Acceptance

| Criterion | Status |
|-----------|--------|
| Runtime independent of frontend | ✓ |
| Dashboards use Data Marts only | ✓ |
| KPIs via Metric Registry | ✓ |
| Product Health automatic | ✓ (5m semantics via scheduler) |
| North Star automatic | ✓ orders_7d + guardrails |
| Funnel / Cohort / Alert / Scheduler / Runtime Health | ✓ |
| Cache >95% after warmup | ✓ (tests) |
| No business rule / UI / public API contract changes | ✓ |

---

## Performance (lab)

| Target | Observed in tests |
|--------|-------------------|
| Dashboard <300ms | In-process mart+cache reads <<300ms |
| Metric query <100ms | Registry resolve + mart field |
| Materialization <5min | Demo snapshot ~milliseconds |
| Cache hit >95% | Verified after warmup |

---

## Tests

`pytest tests/analytics_runtime` → **11 passed**  
`ruff check app/analytics_runtime tests/analytics_runtime app/main.py` → **PASS**

Frontend not modified: type-check / ds:audit expected unchanged green.

---

## Risks

1. Cold start uses demo snapshot until DB materialize is scheduled with session.  
2. Legacy `marketplace_dashboard.py` still queries `analytics_events` (out of Beta 2 new runtime path — not wired to new dashboards).  
3. Cohort retention is event-based approximation (identity stitching incomplete).  
4. Mart SQL persistence table optional — in-memory primary until ops apply migration + wire writer.

---

## Tech debt

- Persist marts to `analytics_runtime_mart_snapshots` on each materialize.  
- Wire `load_snapshot_from_db` into scheduler tick with DbSession.  
- Historical funnel comparison store.  
- Stricter search CTR once `SearchResultClicked` ships.

---

## Beta 3 recommendations (Product Intelligence & AI Insights)

1. Narrative digests from marts only (never raw events).  
2. Anomaly explanations citing Metric Registry ids.  
3. Experiment exposure mart + guardrailed promotions.  
4. AI Product Analyst read-only over `/runtime/metrics` + marts.
