# Content Production Engine (Fase 3)

Transforma um **script aprovado** em pacote técnico pronto para o Publishing Engine.

```
APPROVED SCRIPT
  → PRODUCTION PLAN
  → VOICE
  → VISUALS
  → SUBTITLES
  → VIDEO COMPOSITION
  → THUMBNAIL
  → MEDIA QA
  → STORAGE
  → CONTENT PACKAGE (READY_FOR_PUBLISH)
```

**Não publica.** `READY_FOR_PUBLISH` = tecnicamente pronto para a Fase 4.

## Serviço

`ProductionService` (`api/src/production/ProductionService.ts`)

| Método | Função |
|--------|--------|
| `createProductionRun` / `run` | cria run + executa pipeline |
| `buildPlan` (via planner) | `ProductionPlanner` + profiles |
| `executeStage` | stage isolado + retry |
| `retryStage` | retoma só o stage falho |
| `regenerate` | nova versão de asset + stages dependentes |
| `cancelRun` / `completeRun` | controle de ciclo |

## Estados (`production_runs`)

`QUEUED → PLANNING → VOICE → VISUALS → SUBTITLES → COMPOSING → THUMBNAIL → QA → STORAGE → COMPLETED | PARTIAL | FAILED | REQUIRES_REVIEW | CANCELLED`

## Platform profiles

Centralizados em `PlatformProductionProfiles.ts`:

- YOUTUBE_SHORT / TIKTOK / INSTAGRAM_REEL / PINTEREST
- aspectRatio, resolution, fps, duration, subtitleRules, thumbnailRules

## Providers

| Provider | Status |
|----------|--------|
| MockVoiceProvider | MOCK READY (WAV lavfi verificável) |
| RealVoiceProvider | NOT_CONFIGURED sem credenciais |
| FallbackVisualProvider | ComfyUI → Mock (MISS only) |
| MockVisualProvider | MOCK READY |
| ComfyUIProvider | NOT_CONFIGURED sem `COMFY_BASE_URL` |
| MockThumbnailProvider | MOCK READY |
| LocalFilesystemStorage | READY |
| S3Storage | NOT_CONFIGURED |

## API

| Método | Rota |
|--------|------|
| POST | `/api/production/run` → 202 (default) / 200 com `await:true` |
| GET | `/api/production/runs/:id` |
| POST | `/api/production/runs/:id/retry` |
| POST | `/api/production/runs/:id/cancel` |
| POST | `/api/production/runs/:id/regenerate/:stage` |
| GET | `/api/production/:contentId/assets` |
| GET | `/api/production/workspaces/:workspaceId/runs` |

## Idempotência

- Run: `production:{scriptId}:{platform}`
- Stage: `production:{productionId}:{stage}:v{version}`

## Eventos

`production.started|planned|completed|failed`, `voice.generated`, `visuals.generated`, `subtitles.generated`, `video.composed`, `thumbnail.generated`, `production.qa_passed|qa_failed`

## n8n

WF `05-cwm-content-production.json` v2 → `POST /api/production/run` (Control Plane).
