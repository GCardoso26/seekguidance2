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

## Fase 2 — Pipelines independentes

- **ResearchService** (`api/src/research/`) — providers, normalize, dedupe, score, `research_runs`
- **ScriptFactoryService** (`api/src/scriptFactory/`) — context, hooks, script, CTA, caption, visual brief, QA, `script_runs`, `ai_cost_events`
- Daily Engine **não** foi reescrito; `runResearchEngine` delega ao ResearchService
- LocalOrchestrator (mock) executa ambos via AutomationService

## Fase 3 — Content Production Engine

- **ProductionService** (`api/src/production/`) — plan, voice, visuals, subtitles, compose, thumbnail, media QA, storage, content package
- Tabelas: `production_runs`, `media_assets`, `content_packages`
- WF 05 chama `POST /api/production/run` (não lógica de negócio em Code nodes)
- Retry por stage + DLQ + idempotência `productionId+stage+version`
- Mock gera artefatos FFmpeg verificáveis (`sourceType=MOCK`)

## Fase 4 — Publishing + Analytics Feedback Loop

- **PublishingService** + MockPublisher (`api/src/publishing/`)
- **AnalyticsService** + deterministic MockAnalytics (`api/src/analytics/`)
- **WinnerDetectionService** + ContentDNA (`api/src/winner/`)
- **StrategyService** → research feedback (`api/src/strategy/`)
- Tabelas: `publication_runs`, `metric_snapshots` (+ reuse `strategy_recommendations`, `content_metrics`)
- WF 07/08/09/12 v2 → Control Plane APIs
## Fase 5 — YouTube Controlled Publishing

- CredentialVault + EncryptedCredentialProvider + YouTube OAuth
- YouTubePublisher / YouTubeAnalyticsProvider (REAL READY only when flags+creds allow)
- Safety: kill switch, dry-run, daily limit, human approval
- WF 13 publication monitoring · WF 14 analytics windows (10/11 preserved)
- TikTok/IG/Pin + ads/monetização: NOT_CONFIGURED / BLOCKED
