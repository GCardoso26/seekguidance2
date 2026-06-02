# Judge Performance Monitoring

## Endpoints

- `GET /runtime/judge/tracing` — métricas agregadas
- `GET /runtime/judge/quality` — feedback + cache
- `GET /metrics` — Prometheus text

## Alertas (automáticos no payload tracing)

- `p95_latency > 8s`
- `confidence_avg < 0.55` (≥5 requests)
- `cache_hit_rate < 30%` (≥10 requests)

## Dashboard

`/observability` → secções Infrastructure e Judge Tracing
