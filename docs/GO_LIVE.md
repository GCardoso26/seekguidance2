# Go-Live Checklist — Judge TCG v1.0

## Pré-deploy

- [ ] `pytest tests/marketplace/test_pix_coupon.py -q` passando
- [ ] `supabase db push --include-all` (migrations até `20260621130000`)
- [ ] Env vars Vercel + Render configuradas (ver `DEPLOYMENT.md`)

## Deploy

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

Ou manualmente:

```bash
git push origin main
# Vercel + Render deploy automático
```

## Pós-deploy (smoke tests)

```bash
cd services/api
PRODUCTION_API_URL=https://api.judgetcg.com.br \
PRODUCTION_FRONTEND_URL=https://judgetcg.com.br \
pytest tests/smoke/test_production.py -v
```

## Checklist final (20 itens)

| # | Item | Verificação |
|---|------|-------------|
| 1 | Migration aplicada | `supabase migration list` |
| 2 | Env vars configuradas | Vercel + Render dashboards |
| 3 | Health check 200 | `curl https://api.judgetcg.com.br/v1/health` |
| 4 | Smoke tests passando | `pytest tests/smoke/test_production.py` |
| 5 | PIX com cupom | Checkout → cupom → valor correto no QR |
| 6 | Webhook PIX | OpenPix confirma automaticamente |
| 7 | Pro após pagamento | Assinatura ativa no dashboard |
| 8 | Avaliação pós-compra | `/orders/{id}/review` |
| 9 | Inbox notificações | `/notifications` |
| 10 | Push FCM | Token salvo + push de teste |
| 11 | Sentry | `SENTRY_DSN` + erro de teste |
| 12 | SSL válido | Certificado Let's Encrypt/Cloudflare |
| 13 | LGPD | `/privacidade` + `/termos` |
| 14 | Backup | Supabase daily backup ativo |
| 15 | Docs | `DEPLOYMENT.md`, `CHANGELOG.md` |
| 16 | Suporte 4h SLA | Equipe treinada |
| 17 | Canal emergência | WhatsApp/Telegram |
| 18 | VAPID push web | `VAPID_*` env vars |
| 19 | Firebase Admin | `FIREBASE_*` env vars |
| 20 | Monitoramento | Grafana/Sentry dashboards |

## Firebase Push — configurar

1. [Firebase Console](https://console.firebase.google.com) → projeto "Judge TCG"
2. App Web → copiar config
3. Cloud Messaging → Web Push Certificates → VAPID key
4. Service Account → JSON → `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`
5. Vercel: `NEXT_PUBLIC_FIREBASE_*`
6. Render: `FIREBASE_*` (Admin SDK)

## Rollback

```bash
git revert HEAD
git push origin main
# Restaurar migration se necessário via Supabase dashboard
```
