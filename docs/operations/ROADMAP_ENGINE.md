# Roadmap Engine

Camada **R3-8** — gera **prioridade de expansão** automaticamente.

## Entradas

- Provider Lifecycle
- Expansion Risk
- Competitive Pressure
- GameCapabilities (score)
- Market Readiness

## Proibido como input

- GMV
- Receita
- Métricas de liquidez do North Star

## Saída

`testing/reports/roadmap-recommendation.json`  
`docs/operations/generated/roadmap-recommendation.md`

Ordem de rank segue allowlist ADR-013; score consolida lifecycle, risco, pressão, capabilities e market readiness.

## Código

`services/api/src/catalog/ops/roadmapRecommendation.ts`

## Ajuste fino

Pesos em `roadmapScore()` — alterar apenas quando o MRB validar nova política (sem mudar ADR).

Relaciona: [PORTFOLIO_MANAGEMENT.md](./PORTFOLIO_MANAGEMENT.md) · [OPS_REPORTS.md](./OPS_REPORTS.md).
