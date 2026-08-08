# AI Architecture

## AI Router (único)

`api/src/services/AiRouter.ts`

Tasks: classification, idea_generation, hook_generation, script_generation, qa, strategy, recycling.

Em `AUTOMATION_MODE=mock`, `resolveRouteForMode` força `provider: mock` mantendo modelo para telemetria de custo.

## Prompt versioning

`GET /api/ai/prompts/:name` → `prompt_versions`

Prompts Fase 2: `research_topic_extractor`, `hook_generator`, `script_generator`, `cta_generator`, `caption_generator`, `visual_brief_generator`, `script_qa`.

Workflows n8n **não** hardcodam prompts — carregam do Control Plane.

## Cost tracking

Tabela `ai_cost_events`: provider, model, tokens, estimatedCost, operation, workspace, scriptRun/researchRun.
