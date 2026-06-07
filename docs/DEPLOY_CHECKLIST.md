# Checklist de Deploy — Judge TCG

Última atualização: 2026-06-06 (Sprint 2)

## Infraestrutura

| Componente | URL / comando | Esperado |
|------------|---------------|----------|
| API (Render) | `curl https://seekguidance.onrender.com/v1/health` | HTTP 200 |
| Frontend (Vercel) | `curl -I https://judgetcg.com.br` | HTTP 200 |
| Supabase DB | `supabase migration list` | 23 migrations aplicadas |
| Redis | `redis-cli -u $REDIS_URL ping` | PONG |
| Stripe webhooks | Dashboard → Webhooks → último evento | 2xx |

## Variáveis — API (Render)

- `DATABASE_URL` — pooler Supabase (`postgresql+asyncpg://...`)
- `REDIS_URL`
- `OPENAI_API_KEY`
- `RUNTIME_AUTH_SECRET` (≥32 chars)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `CORS_ALLOWED_ORIGINS` — sem `*` em produção
- `ENVIRONMENT=production`

## Variáveis — Frontend (Vercel)

Root: `frontend/runtime_console_v3`

- `API_PROXY_TARGET` — URL da API Render
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (opcional, push)

## Migrations

```bash
cd supabase
supabase link --project-ref <ref>
supabase db push
supabase migration list
```

## Smoke pós-deploy

```bash
# Health API
curl https://seekguidance.onrender.com/v1/health

# Judge RAG (público)
curl https://seekguidance.onrender.com/runtime/judge/health

# Torneios (lista)
curl https://seekguidance.onrender.com/runtime/judge/tournament/games

# Frontend
curl -I https://judgetcg.com.br/judge
curl -I https://judgetcg.com.br/stores
curl -I https://judgetcg.com.br/tournament/create
```

## Testes antes do deploy

```bash
cd services/api
pytest tests/platform/ -v -m "not e2e"

cd ../../frontend/runtime_console_v3
npm run test
npm run build
```
