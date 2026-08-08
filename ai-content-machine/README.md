# Content War Machine (NEXUS IA) — n8n-first

Máquina de conteúdo dark multiplataforma com arquitetura:

- **Control Plane** — `web/` + `api/`
- **Orchestration Plane** — `n8n/workflows/` (+ LocalOrchestrator em mock)
- **Data Plane** — PostgreSQL (`db/migrations/001_init.sql`) / SQLite local

```
PESQUISA → IDEIAS → ROTEIRO → PRODUÇÃO → QA → APROVAÇÃO
→ PUBLISH → ANALYTICS → WINNER → RECICLAGEM → MONETIZAÇÃO
```

## Quickstart (mock)

```bash
cd ai-content-machine
npm run n8n:validate
cd api && npm install
AUTOMATION_MODE=mock npm test
AUTOMATION_MODE=mock npm run start
```

Em outro terminal:

```bash
cd web && npm install && npm run dev
```

Abra:

- Funil: `http://localhost:5173/`
- Automation Center: `http://localhost:5173/app/automation`

## Aceite MVP (mock)

1. Create Workspace  
2. Start 30-Day War  
3. Run Daily Engine  
4. Ver topics → ideas → scripts → contents → published(MOCK) → metrics → winners → derivatives  

## Scripts

| Script | Função |
|--------|--------|
| `npm run n8n:validate` | Valida JSONs dos workflows |
| `npm run n8n:import` | Importa no n8n (API) |
| `npm run n8n:export` | Exporta do n8n |
| `npm run api:test` | Testes do pipeline mock |

## Docs

- `docs/N8N_ARCHITECTURE.md`
- `docs/N8N_SETUP.md`
- `docs/N8N_WORKFLOWS.md`
- `docs/N8N_CREDENTIALS.md`
- `docs/AUTOMATION_EVENTS.md`
- `docs/AUTOMATION_TROUBLESHOOTING.md`
- `docs/AUDIT.md`

## Princípio de não-fingimento

Publicação, venda e analytics sempre carregam `reality`: `REAL | MOCK | SIMULATED | FAILED | PENDING`.  
Mock nunca é apresentado como produção.
