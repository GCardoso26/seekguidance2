# P1_REMEDIATION_STATUS

**Date:** 2026-07-23  
**Plan:** `REMEDIATION_PLAN_P0_P1.md`

## Results

| ID | Status | Evidence |
|----|--------|----------|
| BUG-V4-003 | **CLOSED** | `require_admin` em stats / asset-ingestion-coverage / asset-health / knowledge-coverage; BFF 401 sem `X-Judge-User-Id` |
| BUG-V4-004 | **CLOSED** | GET coverage read-only; POST `/knowledge-coverage/refresh` + scheduler `refreshAndPersist()` |
| BUG-V4-009 | **CLOSED** | `applyOfficialKnowledgeFromImport` no sync; manifest Gamegenic sleeves com contents/specs/metadata; prod `contents=1 specs=1 metadata=3` |
| BUG-V4-005 | **CLOSED** | `e2e/specs/product-knowledge-panel.spec.ts` (mock route) |
| BUG-V4-011 | **CLOSED** | `knowledgeAffinityBoosts.ts` + `PlatformV4P1Fixes.test.ts` |

## Validation

- `tsc` API + FE: PASS  
- Vitest P1 fixes: PASS  
- Gamegenic knowledge sync: contents/specs/metadata populated  

## Residual

- Admin BFF ainda depende de role `admin` no backend (`judge_profiles.role`); user autenticado não-admin recebe 403 (correto).  
- Demais manufacturers sem campos oficiais no manifest — pipeline pronto, dados sob demanda.  
- P2 ainda abertos (asset package upsert, lifecycle metric, etc.).
