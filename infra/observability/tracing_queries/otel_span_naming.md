# OTEL span naming (TCG Judge)

Stable prefixes (align with `app.observability.runtime_tracing.semantic_trace_spans.SpanNames`):

| Span | Name |
|------|------|
| Retrieval | `tcg.semantic.retrieval` |
| Rerank | `tcg.semantic.rerank` |
| Reasoning | `tcg.semantic.reasoning` |
| Replay validate | `tcg.replay.validate` |
| Graph expand | `tcg.graph.expand` |
| Ontology enrich | `tcg.ontology.enrich` |
| Temporal | `tcg.temporal.lineage` |
| Symbolic sim | `tcg.symbolic.simulation` |

**Gap:** Python services emit logical metadata today; full OTLP export requires SDK + collector config in each deployment.
