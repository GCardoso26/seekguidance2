# Publishing Engine (Fase 4)

Transforma Content Package `READY_FOR_PUBLISH` em publicação rastreável (**MOCK** nesta fase).

```
READY_FOR_PUBLISH
  → validate package
  → publication_runs
  → PlatformPublisher (Mock)
  → PUBLISHED (reality=MOCK)
  → analytics collection
```

## PublishingService

`createPublication` / `validateContentPackage` / `schedule` / `publish` / `cancel` / `retry` / `getPublication`

Validação pré-publish: vídeo final, thumbnail, QA, metadata, profile, license, sem falha de produção aberta.

## PlatformPublisher

| Adapter | Status |
|---------|--------|
| MockPublisher | MOCK READY |
| YouTube / TikTok / Instagram / Pinterest | NOT_CONFIGURED |

## Idempotência

`publication:{workspaceId}:{contentId}:{platform}:v{version}`

## API

- `POST /api/publishing/run` → 202 / `await:true`
- `GET /api/publishing/runs/:id`
- `POST .../retry` · `POST .../cancel`
- `feedbackLoop:true` executa publish → metrics → winner → strategy → research

## n8n

WF 07 v2 → `/api/publishing/run` + analytics sync.
