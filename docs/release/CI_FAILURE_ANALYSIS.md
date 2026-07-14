# CI Failure Analysis — RC1 Final

**Data:** 2026-07-14  
**Commit auditado:** `7d6e32e2` (+ follow-up vitest)

## Resumo por workflow

| Workflow | Conclusão (pós-fix) | Causa raiz | Correção |
|---|---|---|---|
| Security Scan | **success** | TruffleHog `base=default_branch` + `head=HEAD` → base==head no push main | `base/before` · `head/sha` em `security-scan.yml` |
| CI · api | **success** | Ruff I001/E501/E741/F841 em `app tests evaluation` | `ruff --fix` + correções manuais E501/E741/F841 |
| CI · frontend | **failure** → fix tipado | Teste a11y lia `marketplace/checkout/page.tsx` (agora re-export) | Apontar para `app/checkout/page.tsx` |
| Quality Gates | idem frontend Vitest | mesma causa | mesmo fix |
| Lighthouse CI | **success** | — | — |
| Vercel Deploy Hook | **success** | — | — |
| Render Deploy Hook | **success** | — | — |
| smoke-test.yml | **failure 0s** | log não disponível (não roda smoke local) | Smoke local 34/34 via `scripts/smoke_test.py` |

## Validação

- `ruff check app tests evaluation` → **All checks passed**
- Security Scan run `29335442762` → **success**
- Vitest a11y fix validado localmente (5/5)
