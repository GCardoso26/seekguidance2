# n8n — Orchestration Plane

## Layout

```
n8n/
  workflows/     # CWM workflows importáveis (fonte da verdade no git)
  legacy/        # stubs NEXUS anteriores
```

## Validate / import / export

From `ai-content-machine/`:

```bash
npm run n8n:validate
N8N_BASE_URL=... N8N_API_KEY=... npm run n8n:import
N8N_BASE_URL=... N8N_API_KEY=... npm run n8n:export
```

## Design

Workflows chamam o Control Plane (`CWM_API_BASE`) e **não** guardam estado de negócio.  
Prompts vêm de `GET /api/ai/prompts/:name`.  
Credenciais apenas via env / n8n Credentials store.

Shorts: `16-cwm-create-short.json` faz só `POST /api/shorts`. Pesquisa, cenas, assets, voz, render e QA ficam no CWM.
