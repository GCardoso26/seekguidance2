# Wave 2C — Dashboard Infrastructure

## Frontend

`frontend/runtime_console_v3/src/app/observability/page.tsx` — secção **Infrastructure** com:

- Health score (`/runtime/infrastructure` ou `/runtime/judge/health-score`)
- DB / Redis / OTEL
- Warmup embedding & judge
- Fila de ingestão
- Cache hit rate

## Backend

`app/runtime/runtime_infrastructure/dashboard.py` — cálculo de `operational_health_score` (0–100).

## Health score público Judge

`GET /runtime/judge/health-score` — resumo para probes e UptimeRobot.

Pesos aproximados: DB (−35 se offline), Redis (−10), warmup judge (−15), embedding (−10), confiança/cache baixos (−5 a −10).
