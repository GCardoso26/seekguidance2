# Portfolio Management

Visão **R3** de gestão do portfólio de TCGs na allowlist (ADR-013).

## Componentes

| Módulo | Pergunta |
| --- | --- |
| [Ecosystem Health](./ECOSYSTEM_HEALTH.md) | Como está cada camada (eng/ops/market/business)? |
| [Market Readiness](./MARKET_READINESS.md) | O mercado BR suporta expansão? |
| [Expansion Risk](./EXPANSION_RISK.md) | Qual o risco de implementar agora? |
| Expansion Cost (`expansionCost.ts`) | Qual o esforço relativo do Playbook? |
| Competitive Pressure | Quão disputado é o nicho? |
| [Maturity Index](./MATURITY_INDEX.md) | Maturidade holística |
| Executive Portfolio | Tabela única para founder/board |
| [Roadmap Engine](./ROADMAP_ENGINE.md) | Ordem sugerida de expansão |

## Ritual

1. Atualizar perfis operacionais (market, pressure) no MRB.
2. Rodar `npm run test:ops-reports`.
3. Anexar `executive-summary.md` ao Founder Report.
4. Decisões comerciais exigem ADR se mudarem allowlist.

## Fora de escopo

- Novos bounded contexts
- UX / marketplace features
- Payment, SEO, IA, Social, Ranking, ERP, CSV

Relaciona: [EXPANSION_PLAYBOOK.md](./EXPANSION_PLAYBOOK.md) · [R3_FRAMEWORK_EXPANSION.md](./R3_FRAMEWORK_EXPANSION.md).
