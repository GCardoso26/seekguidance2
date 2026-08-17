# Automation Troubleshooting

## SYSTEM_NOT_READY

Causa: `AUTOMATION_MODE=production` sem n8n configurado ou secret inseguro.  
Fix: preencher `N8N_*` ou voltar para `mock`.

## Workflow completed but reality=MOCK

Esperado em `AUTOMATION_MODE=mock`. Não é publicação real.

## Idempotent skip

Mesmo `eventId` / daily key já processado. Normal. Não republica.

## Webhook 401

Assinatura HMAC inválida ou timestamp fora da janela (±5 min).

## Published sem platform_post_id

Bug — nunca deve ocorrer. Publisher só marca `published` após ack (mock ou real).

## Dead letter

Tabela `automation_failures` (`status=open`). Use Automation Center → Retry.

## better-sqlite3 build fail

Instalar toolchains (`python3 make g++`) ou usar imagem Docker da API.
