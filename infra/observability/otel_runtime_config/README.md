# OTEL runtime config (reference)

- Set `OTEL_EXPORTER_OTLP_ENDPOINT` to your collector.
- Align span names with `infra/observability/tracing_queries/otel_span_naming.md`.
- Keep sampling via `OBSERVABILITY_TRACE_SAMPLE_RATE` (API Settings).

**Gap:** sidecar/collector manifests are deployment-specific.
