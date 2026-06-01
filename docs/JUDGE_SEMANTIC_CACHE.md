# Judge — Cache semântico Redis

Módulo: `app/runtime_judge_semantic_cache/`

## Chave

`tcg:cache:{game_slug}:{embedding_hash}`

## Fluxo

1. Embed da pergunta
2. Lookup com similaridade coseno ≥ `JUDGE_SEMANTIC_CACHE_SIMILARITY` (default 0.97)
3. Hit → resposta sem RAG/LLM
4. Miss → pipeline normal + `store` com TTL 24h

## Env

```env
JUDGE_SEMANTIC_CACHE_ENABLED=true
JUDGE_SEMANTIC_CACHE_TTL_SECONDS=86400
JUDGE_SEMANTIC_CACHE_SIMILARITY=0.97
REDIS_URL=redis://...
```

## Invalidação

Após ingestão: `tcg_judge_ingestion/cache_invalidation.py`

## Health

`GET /runtime/judge/health` inclui `cache_hit_rate` e `cache_stats`.
