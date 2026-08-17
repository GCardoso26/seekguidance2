# Workflow editorial

```
CHANNEL
  → RESEARCH
  → VALIDATION
  → IDEA
  → ANGLE
  → TITLE
  → SCRIPT
  → FACT CHECK
  → VISUAL PLAN
  → VOICE
  → VISUALS
  → COMPOSITION
  → SUBTITLES
  → THUMBNAIL
  → SHORT
  → METADATA
  → QA
  → RIGHTS
  → PACKAGE
```

## Mapeamento CWM

| Etapa Skill | Motor CWM |
|---|---|
| CHANNEL | `templates/channel.json` + workspace/niche |
| RESEARCH | `POST /api/research/run` (`ResearchService`) |
| IDEA | `POST /api/editorial/ideas/score` depois `POST /api/ideas` |
| TITLE | `POST /api/editorial/titles/score` |
| SCRIPT | `POST /api/scripts/generate` (`FallbackScriptProvider`) |
| FACT CHECK | `ScriptQaService` + originality |
| VISUAL PLAN | `VisualDirector.buildVisualPlan` (schema canónico) |
| VOICE / VISUALS / COMPOSITION / SUBTITLES / THUMBNAIL / QA / STORAGE | `POST /api/production/run` (`ProductionService` STAGE_ORDER) |
| SHORT | `POST /api/editorial/shorts/adapt` — adaptação editorial, **não crop** |
| RIGHTS | `POST /api/editorial/rights` + licenses do `AssetRegistry` |
| PACKAGE | `ContentPackageBuilder` + `POST /api/editorial/package` |

## Retomada

`ProductionService` ignora `result.stages[stage].ok`. Retry: `POST /api/production/runs/:id/retry`.

## Batch

Seleção + produção + QA sobre o pipeline real. Isolar falhas por `contentId`. Sem batch engine paralelo.
