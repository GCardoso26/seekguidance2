# Explosion Control

## Subsistemas

- **Grafo:** `app/graph/explosion_control/caps.py` — `adaptive_depth_cap`, `semantic_fanout_cap`, `graph_pressure_metrics`, `confidence_aware_prune`.
- **Ramos simbólicos:** `app/reasoning/branching/explosion_predict.py` — `predict_branch_explosion`, `convergence_stability_score` (sobre `branch_pruner`).
- **Replay:** `app/runtime/replay/replay_explosion_control.py` — `replay_dedupe_events`, `replay_equivalence_collapse`.
- **Settings:** `graph_explosion_entropy_prune_threshold` + tuning em `app/tuning/adaptive_caps.py`.

## Caps e pruning

- Expansão de grafo continua limitada por `graph_expansion_min/max` e `compute_graph_expansion_limit`.
- Entropy-aware: quando entropia > limiar, `adaptive_branch_cap` reduz ~12%.

## Riscos

- Pruning agressivo demais → recall baixo em queries ambíguas.
- Subestimar fanout → latência e custo.

## Limitações

- Métricas de entropia real do grafo ainda não ligadas a contadores Prometheus.

## Próximos passos

1. Persistir `graph_pressure_metrics` por `query_id` para tuning offline.
