# Runbook de Operações — Judge TCG

Última atualização: 2026-06-07 (Sprint Final)

## Health checks

```bash
curl -s https://seekguidance.onrender.com/v1/health
curl -sI https://judgetcg.com.br
curl -s https://seekguidance.onrender.com/runtime/judge/health
```

## Deploy

```bash
# Migrations
cd supabase && supabase db push && supabase migration list

# API (Render — via Git push ou dashboard)
git push seekguidance2 main

# Frontend (Vercel)
cd frontend/runtime_console_v3 && vercel --prod
```

## Incidente: API down

1. Verificar [status.render.com](https://status.render.com)
2. Logs: Render Dashboard → Service → Logs
3. Validar env vars (`ENVIRONMENT`, `DATABASE_URL`, `REDIS_URL`, `STRIPE_SECRET_KEY`)
4. Restart manual no dashboard se cold start falhar
5. Escalar instâncias se CPU/memória saturadas

## Incidente: DB lento

1. Supabase Dashboard → Database → Performance
2. Queries ativas: `SELECT pid, query, state, wait_event FROM pg_stat_activity WHERE state != 'idle';`
3. Terminar query problemática: `SELECT pg_terminate_backend(<pid>);`
4. Verificar índices: migration `20260607120000_production_performance.sql`
5. Refresh leaderboard: `REFRESH MATERIALIZED VIEW CONCURRENTLY tcg_judge.leaderboard_cache;`

## Backup manual

```bash
supabase db dump -f backup_$(date +%Y%m%d).sql
```

Restore: usar Supabase Dashboard ou `psql` com cuidado em produção.

## Leaderboard cache (pg_cron)

Se `pg_cron` estiver habilitado no projeto Supabase:

```sql
SELECT cron.schedule(
  'refresh-leaderboards',
  '*/5 * * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY tcg_judge.leaderboard_cache$$
);
```

## Monitoramento

| Métrica | Threshold | Ação |
|---------|-----------|------|
| API 5xx | > 1% | Investigar Sentry + logs |
| p95 latency | > 2s | Escalar Render / otimizar queries |
| DB CPU | > 80% | Escalar plano Supabase |
| Redis memory | > 90% | Limpar cache / aumentar plano |
| Stripe webhooks failed | > 5 | Verificar endpoint e secret |

## Contatos

- Render: dashboard do serviço `seekguidance`
- Vercel: projeto `runtime_console_v3`
- Supabase: project ref no `.env` local / dashboard
