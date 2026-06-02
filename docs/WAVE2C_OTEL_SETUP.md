# Wave 2C — Observabilidade do pipeline Judge

A instrumentação usa `app/runtime/runtime_judge_tracing/` e `app/observability/tracing_runtime.py`.

## Ativar

```env
OBSERVABILITY_OTEL_ENABLED=true
OBSERVABILITY_OTEL_ENDPOINT=https://<otel-collector>:4317
```

Com OTEL desligado, o pipeline funciona sem overhead adicional.

## Endpoints

| Rota | Descrição |
|------|-----------|
| `GET /runtime/judge/tracing` | Snapshot de métricas in-process |
| `GET /metrics` | Texto Prometheus (collector interno) |
| `GET /runtime/infrastructure` | Dashboard: warmup, Redis, DB, health score |

Documentação detalhada: [OTEL_SETUP.md](./OTEL_SETUP.md), [JUDGE_OBSERVABILITY.md](./JUDGE_OBSERVABILITY.md).
