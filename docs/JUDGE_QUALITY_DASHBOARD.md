# Judge — Dashboard de qualidade

## API

`GET /runtime/judge/quality?days=7`

Retorna feedback agregado, cache hit rate, latência P50/P95/P99 (fase), alertas thumbs-down > 20%.

## UI

`frontend/runtime_console_v3/src/app/observability/page.tsx` — secção **Judge Quality**.

## Alertas

Quando `thumbs_down_pct > 0.20` e volume mínimo de feedback, campo `alert` no payload do jogo.
