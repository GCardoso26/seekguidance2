# Observabilidade (AWS)

## OTEL

- Fragmento em `otel/collector-aws.fragment.yaml` — export OTLP para ADOT / collector gerido.
- Variáveis API: `OBSERVABILITY_OTEL_ENABLED`, `OBSERVABILITY_OTEL_ENDPOINT`, `OTEL_RESOURCE_ATTRIBUTES`.

## CloudWatch

- `CLOUDWATCH_LOG_GROUP_API` — structured JSON logs (já suportado via `observability_log_json`).
- Métricas embutidas + adot agent.

## Prometheus / Grafana

- `PROMETHEUS_REMOTE_WRITE_URL` para Amazon Managed Service for Prometheus.
- `GRAFANA_WORKSPACE_URL` para dashboards operacionais (replay, solver, workers).

## X-Ray

- `AWS_XRAY_ENABLED` — instrumentação SDK (roadmap); hoje stub em `app/observability/live_runtime/aws_observability_bridge`.

Dashboards JSON exemplo: `grafana/dashboards/*.json`.
