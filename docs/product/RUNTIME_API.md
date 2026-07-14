# RUNTIME_API.md

**Version:** 1.0.0  
**Router:** `analytics_runtime.api.router` (read-only)

| Method | Path |
|--------|------|
| GET | `/runtime/product-health` |
| GET | `/runtime/north-star` |
| GET | `/runtime/dashboard/executive` |
| GET | `/runtime/dashboard/seller` |
| GET | `/runtime/dashboard/buyer` |
| GET | `/runtime/dashboard/search` |
| GET | `/runtime/dashboard/marketplace` |
| GET | `/runtime/dashboard/operations` |
| GET | `/runtime/dashboard/analytics` |
| GET | `/runtime/funnels` |
| GET | `/runtime/cohorts` |
| GET | `/runtime/alerts` |
| GET | `/runtime/metrics` |
| GET | `/runtime/runtime-health` |
| POST | `/runtime/analytics/materialize` |
| POST | `/runtime/analytics/tick` |

All JSON bodies declare `"source": "data_marts"` where applicable.
