# Strategy Engine

Transforma vencedores em conhecimento reutilizável.

```
Winner(s) → pattern buckets → strategy_recommendations → Research feedback
```

## Kinds

`HOOK_PATTERN` · `TOPIC_PATTERN` · `FORMAT_PATTERN` · `CTA_PATTERN` · `VISUAL_PATTERN` · `DURATION_PATTERN` · `PLATFORM_PATTERN`

## Evidência

- 1 winner → `hypothesis` (não strong)
- `minimumEvidence` (default 3) → `strong` recommendation

Campos: confidence, evidence_count, source_content_ids, status

## Research feedback

Não reescreve o Research Engine. Enriquece keywords do niche e chama `ResearchService.run({ force: true })`.

## API

`POST /api/strategy/analyze` · `GET /api/strategy/workspaces/:id/recommendations`
