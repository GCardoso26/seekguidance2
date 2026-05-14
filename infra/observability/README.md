# Observabilidade

- `prometheus.yml` — scrape da API (requer endpoint `/metrics` no exporter sidecar).
- `otel-collector-minimal.yaml` — collector OTLP mínimo para desenvolvimento.

Grafana: importar dashboards a partir de métricas `app/observability/production_metrics.py` e counters de ingestão.
