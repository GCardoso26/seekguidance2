# Teste de carga — k6

## Pré-requisitos

Instale o [k6](https://k6.io/docs/get-started/installation/) (não via npm — binário nativo):

```bash
# Windows (choco)
choco install k6

# macOS
brew install k6

# Linux — ver .github/workflows/load-test.yml
```

## Scripts

| Script | Uso |
|--------|-----|
| `k6/search-smoke-test.js` | Smoke rápido (~1 min, 5 VUs) |
| `k6/search-load-test.js` | Carga completa (normal + spike + stress) |

## Comandos

```bash
cd frontend/runtime_console_v3

# Smoke em produção
npm run load-test

# Smoke local
k6 run --env BASE_URL=http://localhost:3000 k6/search-smoke-test.js

# Carga completa (cenário normal apenas)
k6 run --env BASE_URL=https://judgetcg.com.br --env SCENARIO=normal_load k6/search-load-test.js

# Cenário spike
k6 run --env SCENARIO=spike_load k6/search-load-test.js
```

## Rate limiting Redis (Upstash)

Configure no Vercel:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Sem essas variáveis, o app usa rate limit em memória (fallback para dev).

Limites atuais (`src/lib/rate-limit-redis.ts`):

| Tier | Limite |
|------|--------|
| search | 20 req/min por IP |
| public | 30 req/min |
| authenticated | 100 req/min |
| checkout | 5 req/min |

## CI

Workflow `.github/workflows/load-test.yml` — smoke toda segunda 3h UTC; disparo manual com opção `full_load`.
