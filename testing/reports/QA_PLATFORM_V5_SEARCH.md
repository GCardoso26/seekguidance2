# QA_PLATFORM_V5_SEARCH

**Date:** 2026-07-23  
**Verdict:** **FAIL / PARTIAL**

## Evidence

| Check | Result |
|-------|--------|
| `search.spec.ts` load + query param | PASS |
| `global-search` (subset run) | included in suite run |
| Marketplace filters E2E | **FAIL** |
| Knowledge/relationship boosts unit | PASS (V4 P1 tests in vitest tree) |
| Semantic/Qdrant live ranking | **NOT_EXECUTED** |
| Hybrid live A/B | NOT_EXECUTED |

## Findings
- Smoke de página de busca OK.  
- Filtros avançados marketplace quebram E2E (BUG-V5-005/006).  
- Boosts V4 unitários não substituem certificação live.

## Gate
Search **não aprovada** integralmente.
