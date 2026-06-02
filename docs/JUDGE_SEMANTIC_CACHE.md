# Cache Semântico Judge (Wave 2A)

## Providers

| Provider | Chave | Hit quando |
|----------|-------|------------|
| `hash` (default) | `tcg:cache:{game}:{model_slug}:{text_hash}` | pergunta idêntica normalizada |
| `embedding` | cache existente por embedding | similaridade coseno ≥ threshold |
| `redis_stack` | reservado | similaridade vetorial RediSearch |

## Config

- `SEMANTIC_CACHE_ENABLED` / `JUDGE_SEMANTIC_CACHE_ENABLED`
- `SEMANTIC_CACHE_PROVIDER=hash|embedding|redis_stack`
- `SEMANTIC_CACHE_TTL_SECONDS`

## Invalidação

Após ingestão: `invalidate_game_cache(game_slug, model_name)` remove chaves do jogo.
Upgrade de modelo altera `model_slug` na chave — invalidação automática.

## Health

`GET /runtime/judge/health` inclui `semantic_cache.enabled`, `provider`, `hit_rate_1h`.
