# Wave 2C — Warmup e cold start

## O que foi implementado

- Lifespan em `services/api/app/main.py` chama `run_startup_warmup()`
- Módulo `app/runtime/runtime_warmup/` — preload de registry, embedding, cache Redis, reranker (condicional)
- Flags em `app/core/config.py`: `warmup_enabled`, `warmup_embedding`, `warmup_reranker`, `warmup_timeout_seconds`
- Endpoints públicos Judge:
  - `GET /runtime/judge/warmup`
  - `GET /runtime/judge/health` (campo `warmup`)
  - `GET /runtime/judge/health-score`
- Aliases legados: `GET /runtime/warmup`, `GET /runtime/warmup/detailed`

## Render

Ver [RENDER_COLD_START.md](./RENDER_COLD_START.md).

## Testes

```bash
cd services/api
pytest tests/runtime_warmup/ -q
```
