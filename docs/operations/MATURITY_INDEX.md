# Maturity Index

Camada **R3-6** — índice composto de maturidade do portfólio.

## Dimensões

| Dimensão | Descrição |
| --- | --- |
| Engineering | Readiness técnico |
| Operations | Certificação e sync |
| Market | Cobertura de marketplace (quando existir) |
| Business | Funil seller/buyer (sem GMV) |
| Expansion | Risco + custo relativo + pressão + market readiness |
| **Overall** | Média das cinco |

## Separação explícita

Métricas de liquidez do **North Star Release 1** aparecem apenas como **referência externa** nesta documentação — **não** entram no cálculo do índice.

## Artefato

`testing/reports/maturity-index.json`

Código: `services/api/src/catalog/ops/maturityIndex.ts`.

Relaciona: [ECOSYSTEM_HEALTH.md](./ECOSYSTEM_HEALTH.md) · [EXPANSION_RISK.md](./EXPANSION_RISK.md) · [PORTFOLIO_MANAGEMENT.md](./PORTFOLIO_MANAGEMENT.md).
