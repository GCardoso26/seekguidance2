# Automation Events

## Domain events

| Event | Quando |
|-------|--------|
| `topic.created` | Tópico de pesquisa persistido |
| `idea.created` | Ideia gerada |
| `script.created` | Roteiro gerado |
| `content.created` | Content record criado |
| `content.approved` | Aprovado (humano ou auto) |
| `content.scheduled` | Agendado |
| `content.published` | Confirmado pela plataforma (ou MOCK explícito) |
| `content.failed` | Falha de produção/publicação |
| `metrics.updated` | Métricas sincronizadas |
| `content.winner_detected` | Classificado WINNER |
| `offer.created` | Oferta criada |
| `lead.created` | Lead capturado |
| `sale.created` | Venda confirmada |

## Webhook n8n → API

`POST /api/webhooks/n8n`

```json
{
  "signature": "...",
  "event": "content.published",
  "timestamp": 1710000000,
  "payload": {}
}
```

Assinatura: HMAC-SHA256 de `${timestamp}.${rawBody}` com `N8N_WEBHOOK_SECRET`.  
Rejeitar se assinatura inválida ou timestamp fora da janela (±5 min).

## Idempotência

Tabela `automation_events`:

- `event_id` único
- Antes de processar: se já `processed` → skip

Evita posts/vídeos/leads/métricas/vendas duplicados.
