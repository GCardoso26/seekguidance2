# Go-Live Checklist — Judge TCG v1.0

## Pré-deploy

- [ ] `pytest tests/marketplace/test_pix_coupon.py -q` passando
- [ ] `pytest tests/marketplace/test_sprint7.py -q` passando
- [ ] `supabase db push --include-all` (migrations até `20260621130000`)
- [ ] Env vars Vercel + Render configuradas (ver `DEPLOYMENT.md`)

## Pagamentos (ativar só no Go-Live)

Até o lançamento, `PAYMENTS_ENABLED=false` — BuyList, escrow e planos lojista funcionam sem cobrança PIX.

No Go-Live, configure no Render:

| Variável | Descrição |
|----------|-----------|
| `PAYMENTS_ENABLED` | `true` |
| `PLATFORM_PIX_KEY` | Chave PIX da plataforma (escrow + planos) |
| `PLATFORM_PIX_KEY_TYPE` | Tipo da chave (`random`, `cpf`, etc.) |
| `OPENPIX_API_KEY` | Gateway automático (opcional) |
| `TCG_API_KEY` | Preços tcgapi.dev (valuation) |
| `UPSTASH_REDIS_*` | Cache busca (opcional) |

Verifique (API atual):

```bash
curl -s https://tcg-judge-api.onrender.com/v1/health | jq '.services.payments,.services.melhor_envio,.go_live_blockers'
```

Esperado pós-flip: `payments: "live"` e `go_live_blockers` sem `payments_deferred`.

**Não** setar `PAYMENTS_ENABLED=true` no `render.yaml` sem secrets + certificação.

## Melhor Envio (frete)

Sem token, health reporta `melhor_envio.status=disabled` e entra em `go_live_blockers`.

No Render, configure:

| Variável | Descrição |
|----------|-----------|
| `MELHOR_ENVIO_TOKEN` | Token OAuth / API Melhor Envio |
| `MELHOR_ENVIO_FROM_ADDRESS` | JSON com `address`, `city`, `state_abbr`, `postal_code` |
| `MELHOR_ENVIO_SANDBOX` | `true` em homologação |
| `MELHOR_ENVIO_WEBHOOK_SECRET` | Validação de webhooks (recomendado) |
| `SHIPPING_V2_ENABLED` | Feature flag frete v2 |

Esperado pós-config: `melhor_envio.status` = `configured` (ou `partial` se só faltar `from_address`).

## Auth — proteção de senhas vazadas (AUDIT-008)

No dashboard Supabase do projeto de produção:

1. **Authentication → Providers → Email** (ou **Auth → Settings → Security**)
2. Ativar **Leaked password protection** (HaveIBeenPwned)
3. Revalidar: advisor `auth_leaked_password_protection` deve sumir

Isto é toggle de Auth — não vai em migration SQL.

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
