# BUSINESS_PROGRAM_1_REPORT.md

**Date:** 2026-07-15  
**Deliverable:** Identity Platform (additive)

## Shipped

| Area | Artifact |
|---|---|
| Package | `services/api/app/identity_platform/` |
| Migration | `supabase/migrations/20260715120000_business_program_1_identity.sql` |
| API | `/runtime/judge/identity/*` mounted in `main.py` |
| Tests | `tests/identity_platform/` (19 unit tests) |
| Docs | `docs/business/*` + `context/business-program-1.md` |

## Acceptance

- User → Company → Store model: **yes** (schema + services)  
- Membership independent: **yes**  
- RBAC + Permission Engine: **yes** (`PermissionService.can`)  
- Subscription decoupled: **yes** (table + projection)  
- Wallet / Trust / KYC / Store Policy prepared: **yes**  
- Event roles SELLER_JUDGE / SELLER_EVENT_MANAGER: **yes**  
- Zero checkout / analytics / marketplace product breakage: **yes** (no edits there)  
- Unit tests + ruff on new paths: **pass**  

## Flags

- `IDENTITY_DUAL_WRITE=true` enables membership → `store_user_roles` sync (default off).
