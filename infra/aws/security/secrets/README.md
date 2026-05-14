# Secrets Manager

- Um secret por ambiente: `tcg-judge/production/api` com chaves JSON (DATABASE_URL, REDIS_URL, OPENAI_API_KEY, …).
- External Secrets Operator sincroniza para `Secret` Kubernetes `tcg-judge-api-env`.

Prefixo configurável: `SECRETS_MANAGER_PREFIX` na API.
