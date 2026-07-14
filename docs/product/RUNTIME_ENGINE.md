# RUNTIME_ENGINE.md

**Version:** 1.0.0  
**Status:** Beta 2 Implemented  
**Package:** `services/api/app/analytics_runtime`

---

## Purpose

Independent Product Analytics Runtime. Transforms events + operational snapshots into materialized Data Marts and serves internal dashboard APIs. **No frontend dependency. No user-visible features.**

## Layout

```
analytics_runtime/
  runtime/engine.py       # facade + singleton ENGINE
  scheduler/              # intervals NRT / 5m / 1h / 24h
  workers/                # source adapters (DB best-effort + demo)
  aggregators/            # incremental AggregationState
  materializers/          # mart writers
  marts/                  # MartStore
  cache/                  # TTL RuntimeCache
  registry/               # Metric Registry
  funnels/ cohorts/ alerts/ health/
  providers/              # dashboard providers (marts only)
  api/router.py           # GET /runtime/*
  observability/          # runtime.* counters
```

## Flow

```text
SourceSnapshot (events + orders + health)
        → Aggregators
        → Funnels / Cohorts / Product Health / North Star / Alerts
        → MartStore (11 marts)
        → RuntimeCache
        → Dashboard Providers / Metric Engine
        → GET /runtime/*
```

**Invariant:** Dashboard providers never query `analytics_events`.
