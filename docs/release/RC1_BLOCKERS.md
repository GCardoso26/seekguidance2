# RC1 Blockers — JudgeTCG

**Data:** 2026-07-13  
**Commit auditado:** `e6a3b884` (+ fix smoke harness pendente de commit)  
**Veredito:** **NO-GO** — tag `RC1` **não** criada

## Blockers (impedem tag RC1)

| ID | Severidade | Descrição | Evidência | Owner |
|---|---|---|---|---|
| B1 | P0 | GitHub Actions billing — CI/Quality Gates/Lighthouse/Playwright **não iniciam** | Runs ~3–5s: *“recent account payments have failed or your spending limit needs to be increased”* — ex. [CI 29263915216](https://github.com/GCardoso26/seekguidance2/actions/runs/29263915216) | Ops / Billing |
| B2 | P0 | BFF `/api/health` **503** — `checks.database.status=error` (“database error”) | `GET https://judgetcg.com.br/api/health` → HTTP 503, `status: degraded` | Frontend env / Supabase |
| B3 | P0 | Smoke prod **FAIL** no BFF Health (fail-fast) | `python scripts/smoke_test.py` — 3 OK, 1 FAIL (BFF) | Release |
| B4 | P1 | Staging validation **não executada** (flags SHIPPING/WISHLIST processados só em docs) | `docs/sprint16/STAGING_ROLLOUT.md` + este RC | Release |
| B5 | P1 | Lighthouse ≥95 **sem evidência** nesta execução (CI LH bloqueado por B1; LHCI local não rodado vs budget RC) | Workflow Lighthouse CI failure billing | Perf |
| B6 | P2 | Backend `features.shipping_v2: false` enquanto FE `shipping_v2: true` | `GET /v1/health` vs `/api/health` | Flags |

## Não-blockers (registrados)

| Item | Notas |
|---|---|
| Working tree | Limpa em `main` (pré-docs) |
| Type-check / lint / vitest / build / ds:audit | Verdes localmente |
| Catalog health API | OK após aceitar `ready_for_marketplace` no smoke |
| Image coverage | 100% (131 526/131 526) no smoke parcial |
| Stashes locais | Existem `git stash` históricos — **não** sujam working tree |

## Critérios da Etapa 8 (tag) vs estado

| Critério | Status |
|---|---|
| working tree limpa | OK (antes do pacote docs) |
| build verde | OK local |
| lint verde | OK (0 errors, warnings only) |
| type-check verde | OK |
| pytest verde | Em execução/validação local — ver QUALITY_GATES |
| vitest verde | OK (387) |
| smoke verde | **FAIL** (B2/B3) |
| lighthouse aprovado | **NÃO** (B5) |
| docs release completa | Este pacote |
| nenhum blocker aberto | **FALSO** |

## Ação requerida antes de reavaliar RC1

1. Resolver billing GitHub Actions (B1).  
2. Corrigir conectividade Supabase do BFF em produção (B2) até `/api/health` → 200.  
3. Reexecutar `python scripts/smoke_test.py` completo (verde).  
4. Rodar LHCI prod ou staging e anexar scores ≥95 (ou ajustar meta documentada com aprovação explícita).  
5. Executar checklist staging (B4) sem promover prod.  
6. Alinhar `SHIPPING_V2_ENABLED` no backend staging/alvo (B6).
