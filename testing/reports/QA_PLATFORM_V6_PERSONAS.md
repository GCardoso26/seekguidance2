# QA_PLATFORM_V6_PERSONAS

**Date:** 2026-07-23 (rev v6.1)  
**Verdict:** **FAIL** (não 100% aprovadas)

| Persona | Status | Evidência |
|---------|--------|-----------|
| Marina | **PASS_PARTIAL** | `seller-lifecycle` 8/8 PASS; PDV full NOT_EXECUTED |
| Carlos | **PASS_PARTIAL** | buyer-lifecycle+filters **11 PASS**; PSP API live PASS; saga/webhook NOT_EXECUTED |
| Juliana | **PASS_PARTIAL** | Panel E2E PASS; collection Gamegenic 20 products; relationships ainda sparse |
| Eduardo | **PARTIAL** | sync soft-fail → runs `completed`; image fetch ainda FAIL; BullMQ NOT_EXECUTED |
| Fernanda | **PARTIAL** | collection+manufacturer; relationships=0 |
| Renato | **FAIL** | Redis ECONNREFUSED; Lighthouse/load NOT_EXECUTED |
