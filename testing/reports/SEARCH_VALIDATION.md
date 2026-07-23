# SEARCH_VALIDATION

**Date:** 2026-07-22  
**Result:** **UNPROVEN / FAIL for V4 boosts**

## Lexical hybrid path

`HybridProductSearch` implements tsvector/trgm + secondary relationship boost + knowledge affinity (collection/publisher/game/expansion/lifecycle).

## Certification

| Item | Status |
|------|--------|
| Lexical ranking | Code present; no master products to query |
| Relationship boost secondary | Code; untested vs live |
| Collection/publisher/expansion/lifecycle boost | Code; **no integration test** (BUG-V4-011) |
| Does not replace lexical | By design in code review ✅ |
| Semantic embeddings | Optional OpenAI; skipped without key |
| Playwright search specs | Exist; **not re-run** this campaign |

## Verdict

V4 search boosts **not certified**. Cannot PASS.
