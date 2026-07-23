# P2_REMEDIATION_STATUS

**Date:** 2026-07-23  
**Plan:** `REMEDIATION_PLAN_P0_P1.md` (P2 section) + `BUG_BACKLOG.md`

## Results

| ID | Status | Evidence |
|----|--------|----------|
| BUG-V4-006 | **CLOSED** | `identity_key` + `ON CONFLICT` em `ProductAssetPackageService`; migration `20260722250000_product_catalog_p2_uniques.sql` aplicada em prod |
| BUG-V4-007 | **CLOSED** | `lifecycleCoverage = pct(withLifecycle, products)` — AVAILABLE conta; TS + Python alinhados |
| BUG-V4-008 | **CLOSED** | `uq_collections_code` (partial unique) + `ON CONFLICT (code)` em `ProductCollectionsService` |
| BUG-V4-012 | **CLOSED** | Empty states `product-knowledge-unbound` / `product-knowledge-empty` no PDP; e2e unbound |

## Validation

- Migration prod `rjgzaakhzuzdzcooywva`: `identity_key` + unique indexes  
- Vitest `PlatformV4P2Fixes.test.ts`  
- E2E Knowledge Panel: painel cheio + unbound  

## Residual

- P3: BUG-V4-010 (RLS em `product_catalog`) **CLOSED** — ver `P3_REMEDIATION_STATUS.md`.
