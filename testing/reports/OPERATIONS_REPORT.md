# OPERATIONS_REPORT — AUDIT_PASS_2026-07-29

## Stack observado

| Serviço | Estado evidenciado |
|---|---|
| Render API `tcg-judge-api` | healthy |
| Redis (Render KV) | ok |
| Checkout-v2 | health ok |
| Supabase Postgres | ok agora; outage disco 29/07 |
| Sentry | disabled |
| Cron accessories | falhou por manifests (fix Docker 8b15ba4a/d5c06eed/5ffdebe5 — rebuild deve ser revalidado) |
| BullMQ certify | não executado |

## Observabilidade

Sem Sentry em prod health → erros de runtime podem ser cegos.

## Runbook sugerido (ops, não feature)

1. Alerta disco Supabase + Render health `database!=ok`
2. Re-rodar cron accessories pós-deploy workers e confirmar `ok:true`
3. Habilitar Sentry ou equivalente antes de Beta

## Veredito ops

**Parcialmente estável; não certificado para Beta público.**
