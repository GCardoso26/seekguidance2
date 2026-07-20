# testing/ — infraestrutura permanente de QA

**Não é produto.** Isola seeds, personas, Playwright e smoke de Beta/Produção.

Ver: [`docs/testing/TESTING_ARCHITECTURE.md`](../docs/testing/TESTING_ARCHITECTURE.md)

## Layout

| Pasta | Função |
|-------|--------|
| `personas/archetypes` | Comportamento reutilizável |
| `catalogs/` | Datasets por TCG |
| `personas/games/` | Packs compostos (IDs estáveis) |
| `scenarios/` | Scenario → game → archetypes → flow |
| `executors/` | Simulation Layer |
| `analytics/` | TCS / PCS (FCS no orchestrator — ver QA_OPERATIONAL_MEMORY) |
| `audit/` | Environment Audit (SRE) |
| `reports/` | Artefatos gerados |

```bash
npm run test:audit          # Ricardo — Environment Audit
npm run test:campaign:gates # Audit + Smoke
npm run test:qa:orchestrator # R4 — todas as personas + handoff Cursor + histórico
npm run test:qa:trends       # Regenera quality-trends.md a partir do warehouse
npm run test:personas
npm run test:compose
npm run test:coverage
```
