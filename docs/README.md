# Judge TCG — Documentação

Plataforma de rulings, torneios e marketplace TCG — [judgetcg.com.br](https://judgetcg.com.br).

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 15 (`frontend/runtime_console_v3`) |
| Mobile | Expo WebView (`apps/mobile`) |
| API | Python FastAPI (`services/api`) |
| DB | Supabase Postgres (`tcg_judge`) |
| Auth | Supabase Auth |
| Pagamentos | Stripe + Stripe Connect |

## Setup local

```bash
# Backend
cd services/api
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend/runtime_console_v3
npm install
npm run dev

# Migrations
cd supabase
supabase db push
```

## Variáveis de ambiente

Copie `.env.production.example` para `.env.production` e preencha credenciais.

Em `ENVIRONMENT=production`, a API valida `STRIPE_SECRET_KEY`, `REDIS_URL` e `DATABASE_URL` no startup.

Ver também [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) para smoke tests pós-deploy.

### Marketplace (v1.7)

Ver [MARKETPLACE.md](MARKETPLACE.md) e checklist completo em [SMOKE_TEST.md](SMOKE_TEST.md).

## Worker (ranking decay + relatório semanal)

```bash
cd services/api
python worker_main.py
```

Jobs agendados (UTC):

| Job | Horário | Descrição |
|-----|---------|-----------|
| `ranking_decay` | 04:00 diário | Decay de ranking |
| `weekly_report` | Segunda 12:00 | Email semanal (9h BRT) |

Variáveis no Render (worker):

- `RESEND_API_KEY` — envio de email
- `WEEKLY_REPORT_EMAIL` — destinatário (default: `admin@judgetcg.com.br`)
- `WEEKLY_REPORT_DIR` — pasta de fallback se email falhar

Testar relatório manualmente:

```bash
cd services/api
python -m app.jobs.weekly_report
```

## Smoke test (CI/CD)

Script Python (recomendado):

```bash
pip install requests
python scripts/smoke_test.py
```

Variáveis opcionais: `SMOKE_FRONTEND_URL`, `SMOKE_API_URL`, `SMOKE_FAIL_FAST=0` (rodar todos os testes).

Alternativa bash: `bash scripts/smoke-test-prod.sh`

GitHub Actions: workflow `.github/workflows/smoke-test.yml` — a cada 6h, push em `main`, ou manual (`workflow_dispatch`).
