# RC1 Readiness — pós RC1.2 Quality Gates Recovery

**Data:** 2026-07-14  
**Decisão:** **RC1 BLOCKED**

## Lab desktop (pós RC1.2)

| Gate | Meta | Medido | |
|---|---|---|---|
| Perf críticas | ≥95 | `/` 100 · `/loja` 97 · checkout 95 · cart 96 · comprador 97 · decks 97 | PASS |
| LCP | &lt;2s | ≤1.5s críticas | PASS |
| CLS | &lt;0.05 | ≤0.004 | PASS |
| SEO | 100 | 100 | PASS |
| A11y | ≥98 | **100** | PASS |
| BP | 100 | **100** | PASS |
| Console | limpo | `errors-in-console` =1 | PASS |

## Production

| Gate | Status |
|---|---|
| Deploy RC1.1+RC1.2 | **PENDENTE** |
| Re-LH prod A11y/BP | **PENDENTE** (último artefato: A~93 BP 96) |

## Ainda bloqueia tag

1. Deploy + Lighthouse production ≥ metas  
2. CI GitHub Actions (B1 billing)

## Score

**8.4 / 10** — Quality gates lab fechados; ship/prod + CI faltam para READY.
