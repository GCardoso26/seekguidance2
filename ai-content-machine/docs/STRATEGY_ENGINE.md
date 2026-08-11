# Strategy Engine

Transforma vencedores (e, sem WINNER, publicações REAL rastreadas) em conhecimento reutilizável.

```
Winner(s) → pattern buckets → strategy_recommendations → Research feedback
       ↘ (0 winners) REAL published + snapshot → hipóteses exploratórias
```

## Kinds

`HOOK_PATTERN` · `TOPIC_PATTERN` · `FORMAT_PATTERN` · `CTA_PATTERN` · `VISUAL_PATTERN` · `DURATION_PATTERN` · `PLATFORM_PATTERN`

## Evidência

- 1 winner → `hypothesis` (não strong)
- `minimumEvidence` (default 3) → `strong` recommendation
- 0 winners + publicação `publication_source=REAL` com snapshot → `hypothesis` exploratória (`data_origin=REAL`), nunca strong

Campos: confidence, evidence_count, source_content_ids, status, data_origin

Envelope `reality` do analyze = `REAL` se alguma recommendation tiver `data_origin=REAL`.

## Research feedback

Não reescreve o Research Engine. Enriquece keywords do niche e chama `ResearchService.run({ force: true })`.

## API

`POST /api/strategy/analyze` · `GET /api/strategy/workspaces/:id/recommendations`
