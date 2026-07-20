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
| `analytics/` | TCS / PCS |
| `reports/` | Artefatos gerados |

```bash
npm run test:personas
npm run test:compose
npm run test:coverage
```
