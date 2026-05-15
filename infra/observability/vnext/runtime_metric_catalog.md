# Catálogo de métricas runtime (prefixos)

| Prefixo | Uso |
| --- | --- |
| `tcg_judge_replay_` | entropia, diffs, reconciliação |
| `tcg_judge_runtime_` | saúde, custo, degradação |
| `tcg_judge_mobile_` | sync, filas, readiness |
| `tcg_judge_lineage_` | âncoras, profundidade, merges |

Implementação de referência: `app/observability/runtime_exporters/metric_registry.py`.

Spans OTEL: `app/observability/runtime_exporters/span_registry.py`.
