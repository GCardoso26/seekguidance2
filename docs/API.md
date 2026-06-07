# API Judge TCG

Base: `/runtime/judge`

## Torneios
- `GET/POST /tournaments` — listar/criar
- `POST /tournaments/{id}/start-check-in` — check-in
- `GET /tournaments/search` — busca avançada

## Jogadores
- `GET /players/{handle}` — perfil público
- `PUT /players/me` — atualizar perfil
- `GET /leaderboards/{game}/{format}` — ranking

## Ligas
- `POST /leagues` — criar liga
- `GET /leagues/{id}` — detalhes + standings
- `POST /leagues/{id}/join` — entrar

## Social
- `POST /social/friends/request` — solicitar amizade
- `GET /social/messages/{other_id}` — conversa
- `POST /social/communities` — criar comunidade

## Admin (role: admin)
- `GET /admin/stats`
- `POST /admin/users/{id}/ban`
- `POST /admin/broadcast`

## Notificações
- `POST /notifications/subscribe` — Web Push VAPID
