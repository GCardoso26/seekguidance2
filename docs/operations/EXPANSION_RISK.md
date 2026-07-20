# Expansion Risk

Camada **R3-4** — classifica risco de expandir um TCG antes de comprometer engenharia.

## Fatores (0–100)

| Fator | Origem |
| --- | --- |
| Provider Coverage | Perfil de certificação |
| Capabilities | `GameCapabilities` |
| Dataset | Cards sincronizados / estágio lifecycle |
| Mercado BR | Market Readiness |
| Documentação | GameConfig + ops docs |
| Certification | PASS / FAIL / PENDING |
| Lifecycle | Planned → Beachhead |

## Níveis

`LOW` · `MEDIUM` · `HIGH` · `VERY_HIGH`

## Gerar

`testing/reports/expansion-risk.json` via `npm run test:ops-reports`.

Código: `services/api/src/catalog/ops/expansionRisk.ts`.

Usado por: [Maturity Index](./MATURITY_INDEX.md) · [Executive Portfolio](./OPS_REPORTS.md) · [ROADMAP_ENGINE.md](./ROADMAP_ENGINE.md).

Não substitui certification gate (ADR-006).
