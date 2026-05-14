# Grafana / dashboards (produção)

- Painéis sugeridos: latência p50/p95 (`/metrics`), determinismo de replay, ingestão stale, drift semântico, filas de workers.
- Exportar JSON de dashboards para `infra/observability/dashboards/` quando estabilizados.
- Correlação OTEL: usar `app/observability/otel_spans.py` para atributos consistentes (`tcg.operation`, `tcg.game`).

Ver também `infra/metrics/README.md`.
