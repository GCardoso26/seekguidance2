# Database Certification — runner notes

## Como rodar

```bash
cd services/api
# migrations aplicadas no alvo
export DATABASE_URL=postgres://...
# ou CONTRACT_DATABASE_URL
npm run certify:db
```

O runner (`src/platform/db/databaseCertification.ts`) verifica:

1. Conectividade
2. Schemas `catalog` / `platform` existem
3. Tabelas outbox + catalog cards/sets/variants/mappings
4. Colunas `row_version` e `committed_at`
5. Índices críticos (nomes esperados)
6. Smoke: INSERT outbox + claim SKIP LOCKED com dois clients (quando possível)
7. Smoke timing: upsert card (via SQL mínimo) vs budget

Exit code `0` = passou; `1` = falhou. Sem `DATABASE_URL` o comando **sai com erro** (não skip) — certificação é explícita.

## Relação com Contract Tests

| Suite | Valida |
|-------|--------|
| `npm run test:contracts` (InMemory) | comportamento do port |
| `npm run test:contracts` + `CONTRACT_DATABASE_URL` | mesmo comportamento no PG |
| `npm run certify:db` | infraestrutura (migrations, índices, SKIP LOCKED, budgets) |

Ambos verdes antes de Scryfall SHADOW.
