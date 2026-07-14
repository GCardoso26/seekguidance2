# RC1 Release Completed

**Data:** 2026-07-14  
**Decisão:** 🎉 **RC1 LIBERADA PARA PUBLIC BETA**

## Identificadores

| Item | Valor |
|---|---|
| Tag | **`RC1`** |
| Commit da release | `bb7f9bd9` (docs) / código perf `7d6e32e2`+`ea92e9ad` |
| Deployment ID | `dpl_FHMmjYpsh2W9ewvrC9e5LJpk1z2Y` |
| Production URL | https://judgetcg.com.br |
| Inspector | https://vercel.com/guilhermebcardoso13-1626s-projects/project-eye28/FHMmjYpsh2W9ewvrC9e5LJpk1z2Y |

## Lighthouse Final (prod desktop)

Ver `docs/frontend/PRODUCTION_LIGHTHOUSE_RC_FINAL.md`.

Destaques: `/checkout` **P99 LCP 0.8s** · `/loja/busca` **P97 LCP 1.1s** · A/BP/SEO **100**.

## CI / Pipeline

| Workflow | Status |
|---|---|
| CI | **success** |
| Quality Gates | **success** |
| Security Scan | **success** |
| Lighthouse CI | **success** |
| Smoke local prod | **34/34** |
| smoke-test.yml (GH) | failure 0s (cancelamento/concorrência; evidência canônica = smoke local) |

## Health

BFF + Render judge health **200**.

## Riscos remanescentes

- Playwright E2E pode ainda estar em curso / flaky — fora do gate minimal RC1 listado.  
- `SHIPPING_V2` FE on / BE flag false.  
- `/loja/busca` Perf 97 (margem baixa vs 95).  

## Rollback

1. Vercel → Promote previous production deployment  
2. `git revert` / redeploy `968cef1e` era pré-perf-final se necessário  
3. Runbook: `context/11- release/rollback-strategy.md`

## Checklist

- [x] Perf/A11y/BP/SEO/LCP/CLS metas produção  
- [x] Smoke 34/34  
- [x] Ruff + Security + CI + QG  
- [x] Tag `RC1` + GitHub Release  
- [x] Release notes / changelog atualizados  
