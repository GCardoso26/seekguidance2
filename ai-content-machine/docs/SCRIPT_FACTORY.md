# Script Factory

Pipeline independente de geração de roteiros.

```
Trigger → Validate Idea → Script Run → Context → Prompts
→ Hooks → Best Hook → Script → CTA → Caption → Visual Brief
→ QA → Persist → Events → Update Run
```

## Service

`api/src/scriptFactory/ScriptFactoryService.ts`

Componentes: ContextBuilder, HookGenerator, ScriptGenerator, CtaGenerator, CaptionGenerator, VisualBriefGenerator, ScriptQaService, PlatformProfiles.

## Script schema

```json
{ "hook","setup","problem","insight","value","proof","cta" }
```

## QA

Falhas → `requires_review` / `failed`. Nunca `approved` automático se QA falhar.

## Cost

Cada operação registra em `ai_cost_events` via AI Router + Prompt versions.

## Idempotência

`script:{contentIdeaId}:pv{version}:{platform}`

## API

- `POST /api/scripts/generate`
- `GET /api/scripts/runs/:id`
- `GET /api/scripts/workspaces/:id/runs`

## n8n

`n8n/workflows/04-cwm-script-factory.json` (v2)
