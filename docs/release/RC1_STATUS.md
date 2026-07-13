# RC1 Status

**Versão candidata:** RC1 (não taggeada)  
**Branch:** `main` @ `e6a3b884`  
**Data:** 2026-07-13  
**Status:** **NO-GO / Feature Freeze mantido**

## Resumo

O produto (Sprints 1–17) está em feature freeze. Gates locais de frontend estão verdes. A promoção oficial para tag `RC1` está **bloqueada** por billing CI, health BFF 503 e ausência de evidência Lighthouse/staging.

## Gates locais (evidência 2026-07-13)

| Gate | Resultado |
|---|---|
| `git status` | working tree clean (pré-docs) |
| `npm run type-check` | **PASS** |
| `npm run lint` | **PASS** (0 errors / ~61 warnings) |
| `npm run test` (vitest) | **PASS** 116 files / 387 tests |
| `npm run build` | **PASS** (NODE 8GB) |
| `npm run ds:audit` | **PASS** 0 hits |
| a11y vitest | **PASS** 19 tests |
| smoke prod | **FAIL** BFF Health 503 |
| GitHub Actions CI | **FAIL** billing |
| Lighthouse CI | **FAIL** billing / sem score anexado |

## Feature freeze

Nenhuma feature nova nesta execução. Correção permitida: harness smoke aceita `ready_for_marketplace` (contrato real do catalog health).

## Próximo passo

Ver `RC1_BLOCKERS.md` → resolver B1–B5 → reabrir Etapa 8.
