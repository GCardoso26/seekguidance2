# Judge — Observabilidade Wave 2A

## Endpoints

| Rota | Uso |
|------|-----|
| `/runtime/judge/health` | Status + `cache_hit_rate` |
| `/runtime/judge/quality` | Métricas operacionais |

## Fases SSE (streaming)

`embedding` → `retrieving` → `reranking` (se activo) → `generating`

## Integridade

Todos os payloads novos incluem `integrity_status: "ok"` quando aplicável.

## CI

Ver `docs/JUDGE_EVALUATION_PIPELINE.md`.
