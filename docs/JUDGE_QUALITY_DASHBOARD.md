# Dashboard de Qualidade Judge (Wave 2A)

## Endpoints

- `GET /runtime/judge/quality` — payload operacional (feedback, cache, latência)
- `GET /runtime/judge/quality-metrics` — formato agregado por jogo para dashboard

## Alertas

`alert_active=true` quando thumbs_down > 20% em janela de 48h (mín. 5 votos).

Webhook opcional: `ALERT_WEBHOOK_URL` (Slack/Discord JSON `{text: ...}`).

## Frontend

Observability Center → secção Judge Quality com cache hit, latência P95 e feedback por jogo.
