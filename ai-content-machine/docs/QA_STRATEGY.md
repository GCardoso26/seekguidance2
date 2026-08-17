# QA Strategy

## Script QA

`ScriptQaService` valida:

- seções obrigatórias
- CTA presente
- claims proibidos
- marcadores de alucinação
- duração estimada vs target da plataforma

Scores: hookStrength, clarity, novelty, retentionPotential, platformFit, ctaQuality, factualRisk.

## Safety outcomes

| Resultado | Persistência |
|-----------|--------------|
| pass | `status=ready`, `qa_status=passed` |
| requires_review | `status=requires_review` — sem auto-approve |
| fail | `status=failed` |

## Research quality

- source traceability obrigatória
- fingerprint anti-duplicata
- scoreBreakdown explicável

## Media QA (Fase 3)

`MediaQAService` valida o pacote técnico:

- arquivo existe / size > 0 / duration > 0
- resolution, fps, aspect ratio vs `PlatformProductionProfile`
- codecs vídeo/áudio, tracks presentes
- subtítulos (SRT/VTT) sem overlaps; start < end
- thumbnail dimensions/format/size
- licenças conhecidas; checksums

Resultados: `PASS` | `FAIL` | `REQUIRES_REVIEW`

### ProductionQualityScore (0–100)

`technicalQuality`, `audioQuality`, `subtitleQuality`, `visualCompleteness`, `platformFit`, `assetTraceability`

Heurísticas de “beleza” ficam fora do QA técnico binário.

### Quality gate → READY_FOR_PUBLISH

Somente quando voice/visuals/subtitles/final/thumbnail/storage/checksums/licenses estão válidos, **visuais não são mock**, e não há falha aberta.  
`PublishingQualityGate` recusa `mock_visual`. Caso contrário: `REQUIRES_REVIEW` / `READY_FOR_REVIEW`.

## Publication validation (Fase 4)

Antes de publicar, `PublishingService.validateContentPackage` exige:

- package `READY_FOR_PUBLISH`
- final video + thumbnail existem
- checksum/license válidos
- sem falha de produção não resolvida

Falha → `REQUIRES_REVIEW` / `FAILED` (nunca marca REAL).
