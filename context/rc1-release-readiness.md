# RC1 Release Readiness

**Data:** 2026-07-13  
**Decisão:** **NO-GO** para tag `RC1`

## Blockers resolvidos nesta fase

| ID | Item | Status |
|---|---|---|
| B2 | BFF health 503 | **RESOLVIDO** (HTTP 200) |
| B3 | Smoke incompleto/falho | **RESOLVIDO** (34/34) |
| B2b/P2 | redis test env-dependent | **RESOLVIDO** |

## Blockers restantes

| ID | Item | Impede tag? |
|---|---|---|
| B1 | GitHub Actions billing | **SIM** |
| B5 | Lighthouse Perf/SEO meta ≥95 | **SIM** (critério RC) |
| B4 | Staging checklist executado end-to-end | Parcial (docs OK, env flags BE shipping off) |
| B6 | `shipping_v2` FE true / BE false | P2 documentado |

## Readiness score

| Dimensão | Score |
|---|---:|
| Código/freeze | 9.0 |
| Health prod | 8.5 |
| Smoke | 9.0 |
| CI remoto | 2.0 |
| Lighthouse | 4.0 |
| Staging | 6.0 |
| **Agregado** | **6.2 / 10** |

## Recomendação

Manter feature freeze.  
**Não** criar `git tag RC1` até B1 + B5 (ou aprovação explícita para relaxar meta Perf) estarem fechados.
