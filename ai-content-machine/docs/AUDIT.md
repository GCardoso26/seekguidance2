# Auditoria — Content War Machine (pré n8n-first)

Data: 2026-08-08  
Branch: `cursor/ai-content-machine-4c61`

## Estado encontrado

| Área | Status | Notas |
|------|--------|-------|
| Funil web (landing/oferta) | Existe | Vite + React em `web/` |
| Brand / playbook / ideias | Existe | Markdown + JSON estáticos |
| Workflows n8n | Parcial | 3 stubs NEXUS (ideia, lead, derivação) — sem orquestração CWM |
| Backend API | **Ausente** | Sem Control Plane server |
| PostgreSQL schema CWM | **Ausente** | Repo monorepo tem Postgres TCG Judge (isolado) |
| Jobs / filas | **Ausente** | — |
| AI providers | **Ausente** | Prompts só em docs |
| Analytics | CSV manual | `metrics/painel.csv` |
| Auth | **Ausente** | Funil público apenas |
| Docker CWM | **Ausente** | `docker-compose.yml` do monorepo é TCG Judge |
| Docker runtime neste agent | Indisponível | Implementar SQLite local + migrations Postgres |

## Arquitetura alvo (decisão)

```
Control Plane  →  web (dashboard) + api (Node/Fastify)
Orchestration  →  n8n (workflows JSON) + LocalOrchestrator (mock)
Data Plane     →  PostgreSQL (produção) / SQLite (dev+mock sem Docker)
```

## Integrações a preparar

| Integração | Provider real | Mock |
|------------|---------------|------|
| Research | HTTP connectors (configuráveis) | `MockResearchProvider` |
| AI / LLM | OpenAI-compatible via AI Router | `MockAiProvider` |
| TTS / vídeo | stubs de interface | `MockProductionProvider` |
| Publish | TikTok/Meta/YT APIs (credenciais) | `MockPublishProvider` → status `MOCK` |
| Analytics | Platform APIs | `MockAnalyticsProvider` |
| n8n | REST API + webhooks assinados | LocalOrchestrator quando `AUTOMATION_MODE=mock` |

## Princípio de não-fingimento

Estados de execução e publicação sempre carregam `reality`: `REAL | MOCK | SIMULATED | FAILED | PENDING`.
