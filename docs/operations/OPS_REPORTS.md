# Ops Reports — dashboards vivos

Relatórios gerados a partir de `GameConfiguration`, `ProviderLifecycle`, perfis de certificação e camadas **R3** de portfólio. **Não substituem** o North Star Release 1.

## Gerar

```bash
npm run test:ops-reports
```

### Artefatos (pré-R3 + R3)

| Artefato | JSON (`testing/reports/`) | Markdown (`docs/operations/generated/`) |
| --- | --- | --- |
| Provider Certification Dashboard | `provider-certification-dashboard.json` | `provider-certification-dashboard.md` |
| Cardgame Readiness | `cardgame-readiness.json` | `cardgame-readiness.md` |
| Capability Matrix | `capability-matrix.json` | — |
| Marketplace Coverage | `marketplace-coverage.json` | — |
| Seller / Buyer Coverage | `seller-buyer-coverage.json` | — |
| Readiness Matrix | `readiness-matrix.json` | `readiness-matrix.md` |
| **Ecosystem Health** | `ecosystem-health.json` | `ecosystem-health.md` |
| **Market Readiness** | `market-readiness.json` | — |
| **Competitive Pressure** | `competitive-pressure.json` | — |
| **Expansion Risk** | `expansion-risk.json` | — |
| **Expansion Cost** | `expansion-cost.json` | — |
| **Maturity Index** | `maturity-index.json` | — |
| **Executive Portfolio** | `executive-portfolio.json` | `executive-portfolio.md` |
| **Roadmap Recommendation** | `roadmap-recommendation.json` | `roadmap-recommendation.md` |
| **Resumo executivo** | (dentro do bundle) | `executive-summary.md` |
| Bundle completo | `ops-bundle-latest.json` | — |

## Documentação R3+

- [ECOSYSTEM_HEALTH.md](./ECOSYSTEM_HEALTH.md)
- [MARKET_READINESS.md](./MARKET_READINESS.md)
- [EXPANSION_RISK.md](./EXPANSION_RISK.md)
- [MATURITY_INDEX.md](./MATURITY_INDEX.md)
- [PORTFOLIO_MANAGEMENT.md](./PORTFOLIO_MANAGEMENT.md)
- [ROADMAP_ENGINE.md](./ROADMAP_ENGINE.md)
- [EVIDENCE_RELEASE_R4.md](./EVIDENCE_RELEASE_R4.md)
- [MARKET_LEARNING_R5.md](./MARKET_LEARNING_R5.md)

**Status vivo:** [`PROJECT_STATUS.md`](../../PROJECT_STATUS.md) (raiz — gerado automaticamente).

## Fonte da verdade

- **Implementado (auto):** `services/api/src/catalog/ops/`
- **Manual / Beta:** `marketplaceCoverage.ts`, `sellerBuyerCoverage.ts`, `marketReadiness.ts` (perfis MRB)

## MRB / Founder Report

Anexos de engenharia no [Market Review Board](./MARKET_REVIEW_BOARD.md) e [Founder Report Template](./FOUNDER_REPORT_TEMPLATE.md).

Constituição e freeze: [`PLATFORM_CONSTITUTION.md`](../architecture/PLATFORM_CONSTITUTION.md).  
Próxima fase: [`EVIDENCE_RELEASE_R4.md`](./EVIDENCE_RELEASE_R4.md).
