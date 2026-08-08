# N8N Workflows Catalog

| File | Name | Key | Trigger |
|------|------|-----|---------|
| `01-cwm-daily-content-engine.json` | CWM — Daily Content Engine | `content_daily_pipeline` | Cron 07:00 + webhook |
| `02-cwm-research-engine.json` | CWM — Research Engine | `research_engine` | Cron 06:00 + webhook → `/api/research/run` (v2) |
| `03-cwm-idea-generator.json` | CWM — Idea Generator | `idea_generator` | webhook |
| `04-cwm-script-factory.json` | CWM — Script Factory | `script_factory` | webhook → prompts + `/api/scripts/generate` (v2) |
| `05-cwm-content-production.json` | CWM — Content Production | `content_production` | webhook |
| `06-cwm-human-approval-gate.json` | CWM — Human Approval Gate | `human_approval_gate` | webhook |
| `07-cwm-content-publisher.json` | CWM — Content Publisher | `content_publisher` | webhook |
| `08-cwm-analytics-sync.json` | CWM — Analytics Sync | `analytics_sync` | Cron */6h |
| `09-cwm-winner-engine.json` | CWM — Winner Engine | `winner_engine` | Cron 08:30 |
| `10-cwm-content-recycling.json` | CWM — Content Recycling Engine | `content_recycling` | webhook |
| `11-cwm-monetization-engine.json` | CWM — Monetization Engine | `monetization_engine` | webhook |
| `12-cwm-daily-strategy-agent.json` | CWM — Daily Strategy Agent | `daily_strategy_agent` | Cron 05:00 |
| `18-cwm-30-day-war-mode.json` | CWM — 30 Day War Mode | `war_30_day` | Cron + webhook |

## Daily Content Engine — detalhe

**Purpose:** loop diário completo em mock/local orchestrator (e trigger remoto via n8n).

**Inputs:** `workspaceId`  
**Outputs:** topics, ideas, scripts, contents, metrics, derivatives (se WINNER)  
**Failure modes:** workspace pausado, sem canais/nichos, falha de asset validation, publish fail → DLQ  
**Retry:** Control Plane + n8n retry; idempotência por `daily:{workspace}:{date}`

## Princípio

Workflows n8n **disparam** o Control Plane (`POST /api/automation/trigger`) e carregam prompts via `GET /api/ai/prompts/:name`.  
Estado permanente fica no Postgres/SQLite — não no n8n.
