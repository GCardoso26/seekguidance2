# Grafana dashboards — JudgeTCG Sprint 6

Import JSON files into Grafana (Provisioning or UI → Import).

| Dashboard | File |
|-----------|------|
| Plataforma | `judgetcg_platform.json` |
| Sync Pipeline | `judgetcg_sync_pipeline.json` |
| Marketplace | `judgetcg_marketplace.json` |
| Checkout | `judgetcg_checkout.json` |

Scrape target: application `GET /metrics` (Prometheus text).

Alert rules: [`../../prometheus/alerts.yml`](../../prometheus/alerts.yml)

Docs: [`docs/operations/FOUNDATION_OPERATIONS.md`](../../../docs/operations/FOUNDATION_OPERATIONS.md)
