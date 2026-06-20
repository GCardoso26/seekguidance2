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

## Worker (ranking decay)

```bash
cd services/api
python worker_main.py
```

Job agendado: decay de ranking às 04:00 UTC.
