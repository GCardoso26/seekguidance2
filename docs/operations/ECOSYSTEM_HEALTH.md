# Ecosystem Health

Camada **R3-1** — consolida saúde do portfólio em quatro domínios **sem misturar** métricas entre si.

| Domínio | Fonte típica |
| --- | --- |
| **Engineering** | Cardgame Readiness, GameConfiguration, provider modular |
| **Operations** | Provider Certification, sync, checklist SHADOW→LIVE |
| **Market** | Marketplace Coverage (snapshots Beta) |
| **Business** | Seller / Buyer Coverage (funil, sem GMV) |

## Status

| Status | Significado |
| --- | --- |
| `GOOD` | Beachhead/live com overall saudável |
| `NOT_STARTED` | Provider em shadow ou mercado ainda não medido |
| `IMPLEMENTED` | Código pronto, mercado zerado |
| `PLANNED` | Allowlist R3/R4 sem provider |

## Gerar

```bash
npm run test:ops-reports
```

Artefatos: `testing/reports/ecosystem-health.json`, `docs/operations/generated/ecosystem-health.md`.

Código: `services/api/src/catalog/ops/ecosystemHealth.ts`.

## Invariantes

- Não alimenta métricas de liquidez do North Star.
- Não usa personas, seeds ou simulation.

Relaciona: [OPS_REPORTS.md](./OPS_REPORTS.md) · [PORTFOLIO_MANAGEMENT.md](./PORTFOLIO_MANAGEMENT.md).
