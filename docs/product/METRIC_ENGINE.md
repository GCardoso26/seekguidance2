# METRIC_ENGINE.md

**Version:** 1.0.0  
**Module:** `analytics_runtime.registry.metrics`

- Every KPI resolves via `METRIC_REGISTRY`.
- `validate_registry()` enforces unique ids + known mart sources.
- `GET /runtime/metrics` returns value + owner/formula/source/refresh/thresholds/consumers.
- Consumers (executive, search, alerts, …) cannot invent ad-hoc formulas.
