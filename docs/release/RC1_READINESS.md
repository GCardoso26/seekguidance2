# RC1 Readiness — pós deploy production

**Data:** 2026-07-14  
**Decisão:** **RC1 BLOCKED**

## Produção (medido)

| Gate | `/loja` | `/checkout` | Críticas restantes |
|---|---|---|---|
| Perf ≥95 | **100 PASS** | **91 FAIL** | PASS |
| A11y ≥98 | **100** | **100** | **100** |
| BP =100 | **100** | **100** | **100** |
| SEO =100 | **100** | **100** | **100** |
| LCP &lt;2s | **0.7s PASS** | **2.0s FAIL** | PASS |
| CLS &lt;0.05 | **0** | ~0 | PASS (≤0.038) |
| Smoke | | | **34/34** |
| Deploy | | | **READY** `judgetcg.com.br` |

## Score

**9.0 / 10** — Store RC recovered in production; checkout Perf/LCP + CI block tagging.
