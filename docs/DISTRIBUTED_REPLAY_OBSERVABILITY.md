# Observabilidade distribuída de replay

## Conteúdo

- Métricas e correlação em `app/observability/live_runtime/` (`replay_trace_correlation_v2`, `distributed_replay_lineage_metrics_v2`, conflitos de sync, degradação, recuperação).
- Exportador opcional `distributed_replay_otel_exporter` e dashboards Grafana em `infra/observability/vnext/dashboards/`.

## Regras

- Nomes OTEL/Prometheus-safe, agregados, sem PII.
