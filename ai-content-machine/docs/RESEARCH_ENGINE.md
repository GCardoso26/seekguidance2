# Research Engine

Pipeline independente de pesquisa de oportunidades.

```
Trigger → Load Niche → Providers → Normalize → Dedupe
→ Extract Topics → Score → Persist → Events → Update Run
```

## Service

`api/src/research/ResearchService.ts`

Providers implementam:

```ts
interface ResearchProvider {
  name: string
  status: 'READY' | 'NOT_CONFIGURED' | 'ERROR'
  search(input): Promise<ResearchResult[]>
}
```

- `MockResearchProvider` — READY em mock
- Stubs `search`, `youtube`, `reddit`, `trends` — `NOT_CONFIGURED` (nunca SUCCESS)

## Scoring

0–100 com breakdown: demand, trend, engagement, monetization, contentFit, competition, freshness.

## Idempotência

`research:{workspaceId}:{nicheId}:{date}:{providers}`

FAILED não marca idempotente (permite retry).

## API

- `POST /api/research/run`
- `GET /api/research/runs/:id`
- `GET /api/research/workspaces/:id/runs`

## n8n

`n8n/workflows/02-cwm-research-engine.json` (v2)
