# OTEL Setup

## Configuração

```env
OBSERVABILITY_OTEL_ENABLED=true
OBSERVABILITY_OTEL_ENDPOINT=https://your-collector:4318
OBSERVABILITY_TRACE_SAMPLE_RATE=0.1
```

## Compatibilidade

- OTLP (quando `opentelemetry-sdk` instalado)
- Fallback: spans in-memory + structlog sem SDK

## Spans Judge

| Span | Fase |
|------|------|
| judge.request | Request total |
| judge.embedding | Embedding query |
| judge.retrieval | RAG retrieval |
| judge.generating | Response compose |

## Prometheus

Scrape `/metrics` — inclui métricas `judge_*` desde Wave 2C.
