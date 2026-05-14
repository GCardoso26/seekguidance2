# Métricas (Prometheus / Grafana)

- `prometheus-scrape-judge-api.yml` — exemplo de job scrape para a API (expandir com workers de ingestão/replay).
- `alerting_rules_stub.yml` — regras iniciais (latência, determinismo de replay, ingestão stale).

Integrar com `infra/observability/prometheus.yml` existente ou fundir scrape configs no deploy.
