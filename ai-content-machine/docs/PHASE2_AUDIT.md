# Fase 2 — Auditoria de reuso

## Já existe (reutilizar)

| Componente | Local | Ação |
|------------|-------|------|
| AutomationService | `api/src/services/AutomationService.ts` | Plugar runners research/script |
| EventService | `api/src/services/EventService.ts` | Mesmos domain_events |
| AiRouter | `api/src/services/AiRouter.ts` | Estender tasks (hook/qa) |
| PromptService | `api/src/services/PromptService.ts` | Novos prompt names |
| Idempotency | `api/src/lib/idempotency.ts` | Chaves research/script |
| DLQ | `automation_failures` | Retry esgotado |
| mockResearch / mockAi | providers | Viram providers/generators |
| Daily Engine | pipelines/dailyContentEngine.ts | **Não reescrever**; research antigo delega |
| Workflows n8n 02/04 | `n8n/workflows/` | Atualizar para APIs novas |
| Automation Center | web | Adicionar research/script runs |

## Docs ausentes (criar nesta fase)

`ARCHITECTURE.md`, `DATA_MODEL.md`, `AI_ARCHITECTURE.md`, `CONTENT_PIPELINE.md`, `QA_STRATEGY.md`, `RESEARCH_ENGINE.md`, `SCRIPT_FACTORY.md`

## Duplicação a evitar

- Não criar segundo event bus / AI Router / AutomationService
- Research no Daily Engine passa a chamar `ResearchService`
- Script no Daily Engine permanece (compat); Script Factory é caminho independente
