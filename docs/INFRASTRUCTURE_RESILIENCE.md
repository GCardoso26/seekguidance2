# Infrastructure Resilience (Wave 2C)

## Warmup (Epic 1)

- Módulo: `app/runtime/runtime_warmup/`
- Lifespan startup em `main.py`
- `GET /runtime/warmup` — status público
- `GET /runtime/warmup/detailed` — métricas completas
- Métricas: `startup_duration_ms`, `warmup_duration_ms`, `preload_duration_ms`

## OTEL & Prometheus (Epic 3)

- `app/runtime/runtime_judge_tracing/`
- Spans: `judge.request`, `judge.embedding`, `judge.retrieval`, `judge.generating`
- `GET /runtime/judge/tracing`
- Métricas Prometheus: `judge_requests_total`, `judge_confidence_avg`, `judge_cache_hit_rate`

## Ingestion Admin (Epic 4–6)

- `GET/POST /runtime/admin/ingestion/*` (RBAC `ingestion_admin`)
- UI: `/ingestion` no Runtime Console
- Migration: `document_errors`, `uploaded_documents`, `resilience_events`

## Dashboard (Epic 8)

- `GET /runtime/infrastructure` — Operational Health Score 0–100
- Secção **Infrastructure** em `/observability`

## Degradação graciosa

- Redis/Postgres/OTEL indisponíveis → flags em `runtime_resilience`
- Judge continua com fallback local/mock
