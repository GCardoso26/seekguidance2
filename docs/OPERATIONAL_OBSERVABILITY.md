# Operational Observability

## Objetivo

Passar de placeholders a **tracing, métricas e dashboards** utilizáveis em produção, sem acoplar exportadores hard na API.

## Componentes

| Área | Ficheiro / pasta | Função |
|------|-------------------|--------|
| Tracing runtime | `app/observability/tracing_runtime.py` | `trace_id` em `ContextVar`, sampling (`observability_trace_sample_rate`), `configure_otel_runtime` (lazy `opentelemetry`). |
| Profiling | `app/observability/profiling/hotspots.py` | `profile_region`, `branch_fanout_metric`, `timed_call`. |
| Ponte existente | `app/observability/telemetry_bridge.py` | Mantém `configure_tracing` minimal. |
| Grafana | `infra/observability/grafana/dashboards/tcg_judge_overview.json` | Shell de dashboard (queries a preencher). |
| Infra | `infra/observability/DASHBOARDS.md` | Orientação de painéis. |

## Feature gates

- `OBSERVABILITY_OTEL_ENABLED` + endpoint.
- Sampling via `observability_trace_sample_rate` (Settings / env).

## Riscos

- Cardinalidade de labels (sempre incluir `game_slug` com limite de valores).
- Overhead de serialização em spans quentes.

## Limitações

- Export OTLP completo depende de `opentelemetry-sdk` no ambiente de deploy.
- Dashboard JSON é esqueleto até métricas nomeadas estarem estáveis.

## Próximos passos

1. Instrumentar `HybridRetriever.search` e `run_reasoning_engine` com `profile_region`.
2. Publicar métricas `tcg_graph_pruned_total`, `tcg_replay_determinism_score` no exporter Prometheus.
