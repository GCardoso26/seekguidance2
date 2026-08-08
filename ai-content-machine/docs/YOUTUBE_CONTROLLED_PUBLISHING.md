# YouTube Controlled Publishing (Fase 5)

## Princípio

Mocks **permanecem**. YouTube é o único provider real nesta fase.

```
AUTOMATION_MODE=mock     → MockPublisher / MockAnalytics (sempre)
forceReal + safety OK    → YouTubePublisher / YouTubeAnalyticsProvider
```

## Safety defaults (seguros)

| Flag | Default |
|------|---------|
| `GLOBAL_PUBLISHING_KILL_SWITCH` | `true` |
| `PUBLISHING_ENABLED` | `false` |
| `YOUTUBE_PUBLISHING_ENABLED` | `false` |
| `DRY_RUN` | `true` |
| `MAX_PUBLICATIONS_PER_DAY` | `1` |

## Human approval

`READY_FOR_PUBLISH` ≠ auto publish.

Requer: `approved_for_publishing=true` (`POST /api/publishing/approve-for-publish` ou approve com `forPublishing:true`).

## OAuth

```
POST /api/publishing/connections/youtube/start
GET  /api/publishing/connections/youtube/callback
DELETE /api/publishing/connections/youtube
GET  /api/publishing/youtube/status
GET  /api/publishing/connections?workspaceId=
```

Tokens: AES-256-GCM em `platform_connections` via `CWM_CREDENTIALS_ENCRYPTION_KEY`.  
Nunca em logs, events, frontend ou Git.

## UNKNOWN outcome

Timeouts / 5xx / network → `upload_outcome=UNKNOWN` + `REQUIRES_REVIEW`.  
Retry verifica status remoto antes de reenviar upload.

## n8n

- WF 08 — analytics (existente)
- WF 13 — publication monitoring
- WF 14 — real analytics windows  
(WF 10 recycling / 11 monetization preservados)

## REAL_PROVIDER_E2E

Somente com:

```
REAL_PROVIDER_E2E=1
PUBLISHING_ENABLED=true
YOUTUBE_PUBLISHING_ENABLED=true
GLOBAL_PUBLISHING_KILL_SWITCH=false
DRY_RUN=false
```

+ OAuth credentials configuradas.
