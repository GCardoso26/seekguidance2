# Automation Events

## Domain events

| Event | Quando |
|-------|--------|
| `research.started` | Research run iniciada |
| `research.completed` | Research concluída |
| `research.partial` | Alguns providers falharam, outros ok |
| `research.failed` | Todos providers configurados falharam |
| `source.discovered` | Fonte bruta descoberta |
| `topic.created` | Tópico de pesquisa persistido |
| `topic.updated` | Tópico re-scoreado (fingerprint existente) |
| `idea.created` | Ideia gerada |
| `script.started` | Script run iniciada |
| `script.completed` | Script run concluída |
| `script.failed` | Script run falhou / DLQ |
| `script.created` | Roteiro gerado |
| `production.started` | Production run iniciada |
| `production.planned` | Production plan + storyboard |
| `voice.generated` | Voice asset gerado |
| `visuals.generated` | Visual assets gerados |
| `subtitles.generated` | Subtítulos SRT/VTT |
| `video.composed` | FINAL_VIDEO composto |
| `thumbnail.generated` | Thumbnail gerado |
| `production.qa_passed` | Media QA PASS |
| `production.qa_failed` | Media QA FAIL / review |
| `production.completed` | Package pronto (ou review) |
| `production.failed` | Falha de stage / pipeline |
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
