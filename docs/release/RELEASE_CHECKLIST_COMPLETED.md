# Release Checklist Completed — RC1 Deploy

**Fonte:** `context/11- release/release-checklist.md`  
**Data:** 2026-07-14  
**Regra:** marcar **somente** com evidência objetiva.

## Pré-requisitos / Quality

| Item | Status | Evidência |
|---|---|---|
| Código versionado em `main` | ✅ | Push `bb659d93` |
| Working tree limpa no push | ✅ | `PUSH_REPORT.md` |
| Lab A11y ≥98 / BP=100 | ✅ | RC1.2 lab |
| Prod A11y ≥98 / BP=100 | ✅ | `PRODUCTION_LIGHTHOUSE.md` |
| Prod Perf ≥95 em **todas** críticas | ❌ | `/checkout` **91** |
| Prod LCP &lt;2s em **todas** críticas | ❌ | `/checkout` **2.0s** |
| Smoke production | ✅ | **34/34** |
| Health BFF/API | ✅ | HTTP 200 |
| Frontend production deploy | ✅ | `dpl_85fQfyC21x1kipBK1nC14P18EG1D` aliased `judgetcg.com.br` |
| Backend redeploy necessário | ⏭ | Sem delta BE nos commits RC |
| CI verde completo | ❌ | CI/Quality Gates/Security Scan **failure** (frontend+LH+Vercel hook OK) |
| Tag RC1 criada | ⏭ | Explicitamente **não** nesta fase |
| GitHub Release publicada | ⏭ | Explicitamente **não** |

## Observabilidade pós-deploy

| Item | Status | Evidência |
|---|---|---|
| Production URL responde | ✅ | HTTP 200 rotas críticas |
| WebP Store live | ✅ | `/logos/mtg.webp` 200 |
| Lighthouse production executado | ✅ | `PRODUCTION_LIGHTHOUSE.md` |

## Conclusão do checklist

**Não completo para promoção tag RC1** — falhas objetivas: Perf/LCP checkout prod + CI vermelho em jobs API/ruff/security.
