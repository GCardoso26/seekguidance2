# Segurança e Compliance

## SSL/TLS

- Certificado válido via Vercel/Cloudflare
- HSTS habilitado no edge
- TLS 1.2+ mínimo

## LGPD

- Política de privacidade: `/privacidade`
- Termos de uso: `/termos`
- Cookie consent: implementar banner (Mês 1)
- Direito ao esquecimento: endpoint de exclusão de conta (roadmap)

## Anti-fraude

- Rate limiting: middleware FastAPI (100 req/min por IP em produção)
- reCAPTCHA v3: cadastro e checkout (roadmap Mês 1)
- Disputas: sistema de juízes (Mês 3)

## Backups

- PostgreSQL: backup diário Supabase (verificar plano)
- Storage: versionamento S3/Supabase Storage
- Teste de restore: mensal (calendário ops)

## Secrets

- Nunca commitar `.env`
- Rotacionar `JWT_SECRET`, webhook secrets trimestralmente
- Firebase private key apenas no Render (backend)

## Monitoramento

- Sentry: `SENTRY_DSN` (API) + `NEXT_PUBLIC_SENTRY_DSN` (frontend)
- Health: `/v1/health` a cada 30s no uptime monitor
