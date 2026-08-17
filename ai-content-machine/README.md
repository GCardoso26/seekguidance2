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

## Deploy OCI + n8n

Guia completo: **`docs/OCI_DEPLOY.md`**

```bash
cd ai-content-machine
cp .env.oci.example .env
# edite secrets
docker compose --env-file .env up -d --build
```

Abra (local dev):

- Funil: `http://localhost:5173/`
- **Studio (Criar Short):** `http://localhost:5173/studio`
- Automation Center (avançado): `http://localhost:5173/app/automation`

Arquitetura Shorts: `docs/CWM_ARCHITECTURE.md`, `docs/SHORTS_PIPELINE.md`, `docs/ASSET_PIPELINE.md`.

Abra (Docker/OCI):

- Web: `http://SEU_IP:8080/`
- API: `http://SEU_IP:8787/health`
- n8n: `http://SEU_IP:5678/` (só em rede privada; preferir proxy HTTPS)

## Aceite MVP (mock)

1. Create Workspace  
2. Start 30-Day War  
3. Run Daily Engine  
4. Ver topics → ideas → scripts → contents → published(MOCK) → metrics → winners → derivatives  

## Fase 2 — Research + Script Factory

```bash
# Research independente
curl -X POST localhost:8787/api/research/run \
  -H 'content-type: application/json' \
  -d '{"workspaceId":"...","nicheId":"...","await":true}'

# Script Factory independente
curl -X POST localhost:8787/api/scripts/generate \
  -H 'content-type: application/json' \
  -d '{"workspaceId":"...","contentIdeaId":"...","platform":"TIKTOK"}'
```

Docs: `docs/RESEARCH_ENGINE.md`, `docs/SCRIPT_FACTORY.md`

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
