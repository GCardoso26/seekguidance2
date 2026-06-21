# Judge TCG — Contexto v5 (Sprint Final / Go-Live)

**Gerado:** 2026-06-07  
**Repositório:** `S:\tcg-judge` / `GCardoso26/seekguidance2`

## Status consolidado

| Área | Estado |
|------|--------|
| Sprints 0–3 | ✅ Concluídos |
| Migrations Supabase | **25** arquivos (incl. `social_messages`, judge, performance) |
| Testes | ~158 (pytest platform + vitest frontend) |
| Build frontend | ✅ `npm run build` |
| db push | ✅ Aplicado em prod (social + judge + marketplace) |

## Arquitetura produção

```
Cloudflare DNS → Vercel (Next.js 15) → BFF /api/*
Render (FastAPI) → Supabase Postgres + Auth + Storage
Redis (timers, rate limit, cache) | Stripe (billing)
Sentry (opcional, env DSN)
```

URLs atuais:
- Frontend: `judgetcg.com.br` (Vercel)
- API: `seekguidance.onrender.com` (Render) — migrar para `api.tcg-judge.com`
- Domínio alvo: `tcg-judge.com`

## Sprint Final — entregas

1. **Fix juiz:** `ResolveCallModal` envia `infracting_player_id`
2. **DB:** `social_messages` (não conflita com `messages` RAG)
3. **Performance:** `20260607120000_production_performance.sql`
4. **Produção:** `app/config/production.py`, pool DB, Sentry backend
5. **Frontend:** Sentry client opcional, headers CSP já ativos
6. **Docs:** `SECURITY.md`, `RUNBOOK.md`, `DEPLOY_CHECKLIST` atualizado
7. **CI:** job Vitest no GitHub Actions

## Variáveis críticas (Render)

```
ENVIRONMENT=production
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=redis://...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RUNTIME_AUTH_SECRET=<32+ chars>
CORS_ALLOWED_ORIGINS=https://judgetcg.com.br,https://tcg-judge.com
OPENAI_API_KEY=sk-...
SENTRY_DSN=https://...@sentry.io/...  (opcional)
```

## Variáveis críticas (Vercel)

```
API_PROXY_TARGET=https://seekguidance.onrender.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SENTRY_DSN=...  (opcional)
```

## Comandos go-live

```bash
cd supabase && supabase db push
cd services/api && pytest tests/platform/ -m "not e2e" -q
cd frontend/runtime_console_v3 && npm run test && npm run build
```

## Pendências operacionais

- [ ] Vercel: autor GitHub com acesso ao repo (Hobby/private)
- [ ] Render: `STRIPE_SECRET_KEY` e demais envs de produção
- [ ] DNS `api.tcg-judge.com` → Render
- [ ] pg_cron refresh `leaderboard_cache` (opcional)
- [ ] Status page `status.tcg-judge.com`
- [ ] Botão "Chamar Juiz" no fluxo de mesa (jogador)
- [ ] Realtime Supabase para novas chamadas de juiz

## Referências

- `docs/DEPLOY_CHECKLIST.md` — checklist go-live
- `docs/SECURITY.md` — políticas
- `docs/RUNBOOK.md` — incidentes e ops
- `cursor-context-judge-tcg-v4.md` — Sprint 3 detalhado
