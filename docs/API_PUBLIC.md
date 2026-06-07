# API Pública Judge TCG v1

Base URL: `https://api.tcg-judge.com/public/v1`

## Autenticação

```http
X-API-Key: jtcg_live_xxxxxxxx
X-API-Version: v1
```

Gere sua key em `/developer` ou `POST /public/v1/developer/api-keys` (autenticado).

## Rate limits

| Plano | Limite/mês |
|-------|------------|
| Free | 10.000 |
| Pro | 50.000 |
| Enterprise | 1.000.000 |

Headers de resposta: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

## Endpoints

- `GET /tournaments` — listar torneios públicos
- `GET /tournaments/{id}` — detalhes
- `GET /tournaments/{id}/standings` — standings
- `GET /tournaments/{id}/pairings` — pairings
- `GET /players/{handle}` — perfil
- `GET /leaderboards/{game}/{format}` — ranking
- `GET /cards/{game}/search?q=` — busca de cards
- `GET /decklists/marketplace` — decklists à venda

## Webhooks

`POST /public/v1/developer/webhooks`

```json
{
  "url": "https://meusite.com/webhooks/tcg",
  "events": ["tournament.started", "tournament.ended", "standings.updated"]
}
```

Assinatura HMAC-SHA256 no header `X-Judge-Signature`.

## Overlay (sem API key)

- `GET /overlay/{tournamentId}/standings`
- WebSocket: `ws://api/overlay/ws/{tournamentId}`
