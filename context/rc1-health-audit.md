# RC1 Health Audit

**Data:** 2026-07-13  
**Commit health fix:** `fda702e2`  
**Deploy Vercel:** `dpl_AvE9GXW8eJsUVqimn6kjDWu5h3PT` → https://judgetcg.com.br

## Resultados pós-correção

| Endpoint | HTTP | Status |
|---|---|---|
| `GET https://judgetcg.com.br/api/health` | **200** | `status: ok` |
| `GET https://seekguidance.onrender.com/v1/health` | **200** | `status: healthy`, `services.database: ok` |
| `GET …/runtime/judge/health` | **200** | `status: ok` |

### BFF checks (evidência)

```json
{
  "status": "ok",
  "version": "fda702e",
  "checks": {
    "database": { "status": "ok", "error": "supabase_direct_failed:…; using_api_health" },
    "catalog_api": { "status": "ok" },
    "redis": { "status": "ok" }
  }
}
```

## Causa raiz do 503

1. `checkDatabase()` consultava `card_catalog` no schema **public** via Supabase JS. A tabela real é `tcg_judge.card_catalog` e o schema customizado **não** está exposto no PostgREST (`pgrst.db_schemas` nulo).
2. Timeout de 5s no `/v1/health` gerava falso negativo em cold start do Render.

## Correção (código)

- Schema explícito `tcg_judge` + fallback honesto: se PostgREST falhar, usar `services.database` do `/v1/health` da API.
- Timeout API configurável (`HEALTH_API_TIMEOUT_MS`, default 15s).
- Remoção de helper morto `mapServiceStatus`.

## Pendência pós-beta

Expor `tcg_judge` no PostgREST para probe direto sem fallback.
