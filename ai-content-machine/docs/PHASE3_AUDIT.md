# Fase 3 — Audit do existente (pós-implementação)

| Component | Existing | Complete | Reusable | Missing / Status |
|-----------|----------|----------|----------|------------------|
| AutomationService | ✓ | ✓ | ✓ wired `content_production` | — |
| EventService | ✓ | ✓ | ✓ `production.*` events | — |
| AI Router / PromptService | ✓ | ✓ | ✓ | real TTS/image prompts later |
| withRetry / DLQ / idempotency | ✓ | ✓ | ✓ stage keys | — |
| Platform profiles | ✓ | ✓ | production profiles | — |
| mockProduceVideo (Daily) | ✓ paths only | left intact | Daily only | Production uses real FFmpeg mocks |
| FFmpegService | ✓ | ✓ | ✓ | — |
| ProductionService | ✓ | ✓ | ✓ | — |
| media_assets / production_runs | ✓ | ✓ | ✓ | — |
| Voice/Visual/Subtitle/Thumb | ✓ Mock READY | ✓ | stubs NOT_CONFIGURED | real providers |
| AssetStorage | ✓ Local READY | ✓ | S3 stub | S3 credentials |
| n8n WF 05 | ✓ v2 | ✓ | Control Plane API | — |
| Publishing | intentionally out | — | — | **Fase 4** |

**Decisão:** Daily Engine intacto. Production Engine independente com artefatos verificáveis (`sourceType=MOCK`).
