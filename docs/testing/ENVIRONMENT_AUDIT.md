# Environment Audit (Ricardo Menezes — SRE)

Camada **anterior ao Smoke**. A persona funcional (Marina Costa) **não** descobre stack offline só no HTTP de busca.

## Pipeline de campanha

```text
Campanha
    ↓
Environment Audit   ← Ricardo (SRE)
    ↓
Smoke
    ↓
Login
    ↓
Seller (Marina)
    ↓
Buyer (Carlos)
    ↓
Reports
    ↓
Executive Report
    ↓
MRB
```

## Comandos

```bash
# Só infra (Ricardo)
npm run test:audit

# Audit + Smoke (gates mínimos antes de Marina)
npm run test:campaign:gates
```

Artefatos:

- `testing/reports/environment-audit-latest.json`
- `testing/reports/environment-audit-latest.md` (inclui **Ready To Resume**)

## Checks (blocking vs warn)

| Check | Blocking | Notas |
| --- | --- | --- |
| Environment Guard | sim | ADR-014 |
| JUDGE_TEST_ENV / APP_MODE | sim | não beta/prod |
| BASE_URL | sim | |
| Runtime Console | sim | HTTP em `BASE_URL` |
| API health | sim* | *warn se FE up mas API path ausente |
| Redis | sim | TCP `REDIS_URL` ou :6379 |
| PostgreSQL | sim | TCP `DATABASE_URL` ou :5432 |
| Search | sim | TCP :9200 ou HTTP `/search` |
| Workers | não | warn — sem liveness dedicado |
| Projection | não | warn até search Rapunzel OK |
| Storage / Upload | não | warn — campanha funcional |
| Migrations | não | warn — verificar manual |
| Provider Registry | sim | testes API registry/lifecycle |
| Game Configuration | sim | idem |

**FAIL** em qualquer blocking → exit 1 → **Smoke não roda** (`test:campaign:gates` para antes).

## Ricardo vs Marina

| | Ricardo | Marina |
| --- | --- | --- |
| Pergunta | Por que a plataforma não abriu? | Consigo vender cartas? |
| Entra no UI? | Não | Sim |
| Ferramentas | portas, env, health, testes registry | jornada seller/buyer |

## Variáveis úteis

- `BASE_URL` / `SMOKE_BASE_URL` — FE (default `http://localhost:3000`)
- `API_URL` — health da API se diferente do FE
- `REDIS_URL`, `DATABASE_URL`
- `OPENSEARCH_HOST`, `OPENSEARCH_PORT` (default `127.0.0.1:9200`)
- `JUDGE_TEST_ENV=local|ci|staging`

Não usar `SMOKE_SOFT` para mascarar audit fail.

Relaciona: [CERTIFICATION_PIPELINE.md](./CERTIFICATION_PIPELINE.md) · [PERSONA_VALIDATION_PIPELINE.md](./PERSONA_VALIDATION_PIPELINE.md) · [TESTING_ARCHITECTURE.md](./TESTING_ARCHITECTURE.md)
