# Políticas de Segurança — Judge TCG

Última atualização: 2026-06-07 (Sprint Final)

## Escopo

- API (`api.tcg-judge.com` / Render)
- Web App (`tcg-judge.com`, `judgetcg.com.br` / Vercel)
- Mobile App (futuro)
- Infraestrutura (Render, Vercel, Supabase, Stripe)

## Práticas

| Área | Política |
|------|----------|
| RLS | Habilitado em tabelas expostas via Supabase (`tcg_judge`) |
| Secrets | Apenas em environment variables; nunca commitar `.env`, `.pem`, service accounts |
| Dependências | Dependabot + revisão mensal |
| Auth | JWT Supabase; header `X-Judge-User-Id` apenas em rotas internas com BFF |
| SQL | Queries parametrizadas (SQLAlchemy `text` + bind params) |
| XSS | CSP no Next.js; escape de output React |
| CORS | Lista explícita em produção (`CORS_ALLOWED_ORIGINS`) |
| Rate limit | Redis-based no middleware FastAPI |

## Checklist de segurança (go-live)

1. SSL/TLS ativo (Vercel + Render + Cloudflare)
2. CORS sem wildcard em produção
3. Rate limiting testado
4. RLS ativo nas tabelas sociais/torneios/juiz
5. Stripe webhooks com assinatura verificada
6. Backup Supabase habilitado (PITR no plano pago)
7. Sentry DSN configurado (API + frontend)

## Reportar vulnerabilidades

Envie detalhes para **security@tcg-judge.com** (ou contato do mantenedor no GitHub).

Inclua: descrição, passos para reproduzir, impacto estimado. Resposta alvo em 72h.

## Incident Response

1. **Detectar** — Sentry, logs Render/Supabase, alertas Stripe
2. **Contenção** — rotacionar secrets, pausar webhooks, escalar isoladamente
3. **Investigação** — `audit_logs`, logs de API
4. **Correção** — patch + deploy + migration se necessário
5. **Comunicação** — status page (quando disponível)
6. **Post-mortem** — documentar em 48h após resolução

Ver também: `docs/SECURITY_CREDENTIAL_ROTATION.md`, `docs/LGPD_COMPLIANCE.md`.
