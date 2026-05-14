# Worker scaling

Configurações de autoscaling (HPA / queue depth) devem correlacionar:

- `branch_explosion_live` / `runtime_emergency_brakes`
- métricas Prometheus em `infra/observability`

Sem alterar contratos de API ou pipelines simbólicos legados.
