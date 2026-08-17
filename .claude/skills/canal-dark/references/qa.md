# QA

Camadas (não substituir as do CWM):

| Camada | Motor |
|---|---|
| FILE QA | `MediaQAService` (existe, size, duration, codec, checksum) |
| CONTENT QA | `ScriptQaService` + originality |
| VISUAL QA | `VisualQaService` + anti-deep-web |
| AUDIO QA | stage VOICE + MediaQA |
| RIGHTS QA | Rights Gate + `licensesKnown` |
| YOUTUBE QA | `PublishingService.validateContentPackage` + dry-run |
| PUBLISHING QUALITY GATE | `PublishingQualityGate` — **soberano** |

## Status

`READY_FOR_REVIEW` ≠ `READY_FOR_PUBLISH`.

`REJECTED` / `FAILED` / `MISSING` / `UNKNOWN` rights → não publicar.

Mock visual: MP4 pode nascer; gate segura o publish.

Human approval: script `approved` (ou `ready` + `qa_status=passed`) antes de `POST /api/production/run`.

Relatório: `templates/qa-report.md` + output de `POST /api/editorial/package`.
