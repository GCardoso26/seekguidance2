# Deploy Judge TCG

## 1. Migrations

```bash
cd supabase
supabase link --project-ref <ref>
supabase db push
```

Migrations pendentes: `20260605120000`, `20260605140000`, `20260605160000`.

## 2. Serviços

```bash
docker compose -f docker/docker-compose.prod.yml up -d
```

## 3. Checklist go-live

- [ ] Migrations aplicadas com RLS
- [ ] Stripe live keys + webhook
- [ ] VAPID keys para Web Push
- [ ] Redis em produção
- [ ] Worker rodando (`Dockerfile.worker`)
- [ ] SSL/HTTPS no domínio
- [ ] `ENVIRONMENT=production`

## 4. Monitoramento

Configure Sentry/Datadog via variáveis de ambiente do provedor.
