# Backend Deployment — RC1

**Data:** 2026-07-14  
**Nota:** commits RC1.1 / RC1.2 **não alteraram** o backend (somente frontend + docs).

## Ação de deploy

**Nenhum redeploy backend forçado** nesta fase — API de produção já operacional; validação por health.

## Produção API (Render)

| Endpoint | Status | Evidência |
|---|---|---|
| `https://seekguidance.onrender.com/health` | **200** | `status: ok`, integrity ok |
| `https://seekguidance.onrender.com/runtime/judge/health` | **200** | `database: ok`, openai configured, rag games |
| `https://seekguidance.onrender.com/api/health` | **404** | path legado inexistente (não usado) |

## BFF (Vercel / Next)

| Endpoint | Status |
|---|---|
| `https://judgetcg.com.br/api/health` | **200** |
| `https://judgetcg.com.br/api/catalog/health` | **200** |
| `https://judgetcg.com.br/api/catalog/sets` | **200** |

## Feature flags / startup

- Health judge reporta DB ok e RAG pronto.  
- Sem mudança de flags em RC1.1/RC1.2.
