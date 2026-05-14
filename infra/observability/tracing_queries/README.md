# Tracing queries (Tempo / Grafana)

Examples (adapt to your metric names once exporters are live):

- Retrieval p95: `histogram_quantile(0.95, sum(rate(tcg_retrieval_duration_bucket[5m])) by (le))`
- Graph fanout: `sum(rate(tcg_graph_fanout[5m]))`
- Replay amplification: `sum(tcg_replay_events) / sum(tcg_replay_unique_hashes)`

## OTEL span names (conventions)

See `otel_span_naming.md` in this folder.
