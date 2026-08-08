# N8N Architecture — Content War Machine

## Princípio

A aplicação web **não** executa a automação pesada.  
O **n8n** orquestra. O **PostgreSQL** é a fonte de verdade. A app é o **Control Plane**.

```
                    INTERNET
                       │
                       ▼
                 Reverse Proxy
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
   Next/Vite App                   n8n
   (Control Plane)           (Orchestration)
          │                         │
          └────────────┬────────────┘
                       ▼
                  PostgreSQL
                  (Data Plane)
                       │
                     Redis
              (locks / rate limit)
```

## Planos

### Control Plane (App + API)

- Workspaces, canais, nichos, prompts, ofertas
- Approval / calendário / analytics UI
- Automation Center (status, run, retry, pause)
- `AutomationService` → trigger/status/retry/cancel
- Prompt versioning: `GET /api/ai/prompts/:name`
- AI Router (task → provider/model + cost)

### Orchestration Plane (n8n)

- Cron, webhooks, retries, branching
- Chama APIs da Control Plane e providers externos
- **Não** é banco de dados

### Data Plane (PostgreSQL)

Schema app: `content_war` (ou database `content_war`)  
Schema/DB n8n: separado (`n8n`)

## AutomationService

```
triggerWorkflow(workflow, workspaceId, payload) → executionId
getWorkflowStatus(executionId)
getWorkflowExecutions(workspaceId, filters)
retryWorkflow(executionId)
cancelWorkflow(executionId)
```

API:

```
POST /api/automation/trigger
POST /api/webhooks/n8n   (signature required)
GET  /api/ai/prompts/:promptName
```

### Modos

| `AUTOMATION_MODE` | Comportamento |
|-------------------|---------------|
| `mock` | LocalOrchestrator + providers mock. Nunca publica de verdade. Reality=`MOCK` |
| `production` | Exige n8n + credentials + DB + storage. Caso contrário `SYSTEM_NOT_READY` |

## Fluxo canônico (Daily)

```
Research → Topics → Ideas → Hooks → Script → Variants
→ Content → QA → Approval → Schedule → Publish
→ Analytics → Winner → DNA → Derivatives → Loop
```

## Eventos

Ver `AUTOMATION_EVENTS.md`. Persistidos em `domain_events` + idempotência em `automation_events`.

## Concurrency

Limites configuráveis por workspace/provider/platform/workflow (Redis ou store local).

## Retries / DLQ

Exponential backoff → `automation_failures` (Dead Letter). Dashboard Automation Health.

## 30-Day War Mode

Workflow especial + tabela `war_campaigns` com progresso diário adaptativo (`AdaptiveContentPlanner`).
