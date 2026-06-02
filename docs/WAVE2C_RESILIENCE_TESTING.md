# Wave 2C — Testes de resiliência

## Executar

```bash
cd services/api
pytest tests/resilience/ tests/runtime_resilience/ -q
```

## Cenários cobertos

| Cenário | Comportamento esperado |
|---------|------------------------|
| Redis indisponível | Cache miss; query continua |
| Reranker falha | `health_check` retorna false; warmup não bloqueia |
| OTEL desligado | Sem spans exportados; pipeline normal |
| `WARMUP_ENABLED=false` | Startup sem pré-carga |

Degradação global: `app/runtime/runtime_resilience/events.py` (`degraded_status`).

Ver também: [DEGRADED_MODE_OPERATIONS.md](./DEGRADED_MODE_OPERATIONS.md), [INFRASTRUCTURE_RESILIENCE.md](./INFRASTRUCTURE_RESILIENCE.md).
