# Render Deployment Guide

## Serviços

| Serviço | URL |
|---------|-----|
| API | `https://seekguidance.onrender.com` |
| Frontend | Vercel `judgetcg.com.br` |

## Env API (Render)

```env
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=rediss://...
OPENAI_API_KEY=sk-...
JUDGE_SHARE_SECRET=...
ENVIRONMENT=production
OBSERVABILITY_OTEL_ENABLED=false
```

## Warmup

Arranque automático via lifespan — verificar `GET /runtime/warmup`.

## Health

Render health check: `/v1/health` ou `/runtime/judge/health`

## Migrations

```bash
supabase db push
```

Incluir `20260601000000_wave2c_ingestion_diagnostics.sql`
