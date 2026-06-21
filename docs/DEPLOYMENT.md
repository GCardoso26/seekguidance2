# Deploy — Judge TCG Marketplace

## Pré-requisitos

- Node.js 20+
- Python 3.11+
- PostgreSQL 16 (Supabase)
- Redis 7 (opcional, cache)
- Projeto Firebase (push notifications)

## Environment variables

```env
# Database
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=...

# Payment
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_STORE_PRO=...
OPENPIX_API_KEY=...
OPENPIX_WEBHOOK_SECRET=...
PLATFORM_PIX_KEY=...

# Notifications (Firebase Admin SDK + VAPID Web Push)
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@....iam.gserviceaccount.com
VAPID_PRIVATE_KEY=...
VAPID_CONTACT=mailto:suporte@judgetcg.com.br
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...

# App
MARKETPLACE_APP_URL=https://judgetcg.com.br
NEXT_PUBLIC_APP_URL=https://judgetcg.com.br
```

## Deploy

1. `supabase db push` — aplicar migrations
2. Backend: `pip install -r requirements.txt` → Render/Fly
3. Frontend: `npm run build` → Vercel
4. Configurar webhooks PIX (OpenPix/Asaas) apontando para `/api/marketplace/shop/pix/webhook`
5. Configurar variáveis no painel Vercel e Render

## Pós-deploy

- [ ] Migration `20260620200000` e `20260621130000` aplicadas
- [ ] `pytest tests/smoke/test_production.py -v` passando
- [ ] Ver checklist completo em [GO_LIVE.md](./GO_LIVE.md)
