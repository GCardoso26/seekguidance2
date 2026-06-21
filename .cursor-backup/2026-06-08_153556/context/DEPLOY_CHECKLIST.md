# Checklist de Deploy — Judge TCG

Última atualização: 2026-06-07 (Sprint Final / Go-Live)

## Infraestrutura

| Componente | URL / comando | Esperado |
|------------|---------------|----------|
| API (Render) | `curl https://seekguidance.onrender.com/v1/health` | HTTP 200 |
| Frontend (Vercel) | `curl -I https://judgetcg.com.br` | HTTP 200 |
| Supabase DB | `supabase migration list` | **25** migrations aplicadas |
| Redis | `redis-cli -u $REDIS_URL ping` | PONG |
| Stripe webhooks | Dashboard → Webhooks → último evento | 2xx |
| Sentry | Dashboard → Issues | Sem spike pós-deploy |

## Variáveis — API (Render)

Obrigatórias (`ENVIRONMENT=production`):

- `DATABASE_URL` — pooler Supabase (`postgresql+asyncpg://...`)
- `REDIS_URL`
- `OPENAI_API_KEY`
- `RUNTIME_AUTH_SECRET` (≥32 chars)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `CORS_ALLOWED_ORIGINS` — sem `*` em produção

Recomendadas:

- `SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE=0.1`
- `VAPID_PRIVATE_KEY`, `SENDGRID_API_KEY`

## Variáveis — Frontend (Vercel)

Root: `frontend/runtime_console_v3`

- `API_PROXY_TARGET` — URL da API Render
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (opcional, push)
- `NEXT_PUBLIC_SENTRY_DSN` (opcional)

## Migrations

```bash
cd supabase
supabase link --project-ref <ref>
supabase db push
supabase migration list
```

Últimas migrations críticas:

- `20260605160000_production_social_rls.sql` — `social_messages` (não `messages`)
- `20260607000000_judge_system.sql` — painel juiz
- `20260607120000_production_performance.sql` — índices + leaderboard cache

## Pré-deploy

- [ ] `pytest tests/platform/ -m "not e2e"` — verde
- [ ] `npm run test && npm run build` no frontend
- [ ] Secrets no Render e Vercel (sem commit)
- [ ] Stripe webhooks apontando para produção
- [ ] RLS ativo (migration social + marketplace)

## Smoke pós-deploy

```bash
# Health API
curl https://seekguidance.onrender.com/v1/health
curl https://seekguidance.onrender.com/runtime/judge/health

# Torneios
curl https://seekguidance.onrender.com/runtime/judge/tournament/games

# Frontend + headers
curl -I https://judgetcg.com.br/judge
curl -I https://judgetcg.com.br | grep -iE "x-frame|x-content|content-security"

# Segurança básica (rate limit / SQLi smoke)
curl -I "https://seekguidance.onrender.com/runtime/judge/tournaments?id=1%27"
```

## Pós-deploy (24h)

- [ ] Monitorar Sentry
- [ ] Verificar logs Render (5xx)
- [ ] Testar login OAuth + email
- [ ] Testar criar torneio + pagamento Stripe (test mode)
- [ ] Refresh manual leaderboard se necessário:
  `REFRESH MATERIALIZED VIEW CONCURRENTLY tcg_judge.leaderboard_cache;`

## Testes locais antes do deploy

```bash
cd services/api
pytest tests/platform/ -v -m "not e2e"

cd ../../frontend/runtime_console_v3
npm run test
npm run build
```

Ver também: `docs/RUNBOOK.md`, `docs/SECURITY.md`, `cursor-context-judge-tcg-v5.md`.
