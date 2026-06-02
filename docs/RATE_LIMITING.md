# Rate limiting Judge (Wave 2B)

## Limites

| Cliente | Chave Redis/memória | Limite |
|---------|---------------------|--------|
| Anónimo (IP) | `rl:judge:anon:{ip}` | 20 req/min (`RATE_LIMIT_ANON_PER_MIN`) |
| Autenticado | `rl:judge:auth:{sub}` | 60 req/min (`RATE_LIMIT_AUTH_PER_MIN`) |

Autenticação detectada via `Authorization: Bearer` (JWT `sub`) ou header `X-Judge-User-Id`.

## Configuração

```env
RATE_LIMIT_ANON_PER_MIN=20
RATE_LIMIT_AUTH_PER_MIN=60
JUDGE_RATE_LIMIT_ENABLED=true
```

Degradação: sem Redis, usa contador em memória por processo.
