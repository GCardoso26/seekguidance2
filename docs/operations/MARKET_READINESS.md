# Market Readiness

Camada **R3-2** — indicadores qualitativos para o MRB documentar **oferta, procura e competição** por TCG.

## Indicadores (bandas)

- Número de lojas (`storeCountBand`)
- Colecionadores (`collectorInterestBand`)
- Cena competitiva (`competitiveSceneBand`)
- Oferta / procura / competição
- **Beachhead** (boolean)
- **Hipótese** de liquidez (texto)

Bandas: `NONE` · `LOW` · `MEDIUM` · `HIGH`.

## O que não entra

- GMV
- Stripe / pagamentos
- Métricas de liquidez do North Star

## Atualizar

Perfis em `services/api/src/catalog/ops/marketReadiness.ts` (`PROFILES`) com evidência de campo.

Saída: `testing/reports/market-readiness.json`.

Relaciona: [MARKET_REVIEW_BOARD.md](./MARKET_REVIEW_BOARD.md) · [ROADMAP_ENGINE.md](./ROADMAP_ENGINE.md).
