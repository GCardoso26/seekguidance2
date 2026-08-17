# N8N Setup — Content War Machine

## Pré-requisitos

- Node 22+
- Docker (produção / n8n + Postgres separados)
- Variáveis:

```bash
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=...
N8N_WEBHOOK_SECRET=...   # forte, não default
CWM_API_BASE=http://localhost:8787
AUTOMATION_MODE=mock     # ou production
```

## Local sem Docker (este ambiente)

```bash
cd ai-content-machine
npm run n8n:validate
cd api && npm install && AUTOMATION_MODE=mock npm test
AUTOMATION_MODE=mock npm run start
```

SQLite em `ai-content-machine/data/cwm.sqlite` espelha o schema Postgres.

## Com Docker

```bash
cd ai-content-machine
docker compose up -d
npm run n8n:import   # com N8N_API_KEY
```

Bancos:

| Serviço | DB |
|---------|-----|
| App | `content_war` (Postgres :5433) |
| n8n | `n8n` (Postgres interno) |

## Importar workflows

```bash
npm run n8n:validate
N8N_BASE_URL=... N8N_API_KEY=... npm run n8n:import
```

Arquivos em `n8n/workflows/*.json`.

Para criar um Short a partir do n8n, importe `16-cwm-create-short.json` (webhook → `POST /api/shorts` → resposta). Sem IFs de negócio no workflow.

## Credenciais n8n

Nunca coloque API keys nos JSONs. Use:

- Environment variables no container n8n (`CWM_API_BASE`, etc.)
- n8n Credentials store para tokens de plataformas

Ver `N8N_CREDENTIALS.md`.

## Production gate

`AUTOMATION_MODE=production` só sobe se:

- `N8N_BASE_URL` + `N8N_API_KEY`
- `N8N_WEBHOOK_SECRET` seguro
- Caso contrário: `SYSTEM_NOT_READY`
