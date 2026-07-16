# RBAC_AUDIT.md

## Objective

Verify Buyer → Seller → Manager → Staff → Judge → Organizer → Admin → Super Admin across endpoints, dashboards, buttons, actions. No hardcoded elevation; find bypasses.

## Matrix vs reality

| Expected | Reality (audit) | IDs |
|----------|-----------------|-----|
| create_event requires events permission | Soft-open (`pass` on deny) | RBAC-001 |
| Staff can act via store.events.* | RC1 flow `_require_organizer` (created_by) | RBAC-002 |
| Financial mutate = store finance or admin | Auth only | SEC-001 |
| Tournament mutate = staff/judge scoped | `_require_user` only on many writes | SEC-002 |
| Sandbox elevate = allowlisted emails | Empty list elevates all | ADM-001 |
| planHasFeature respects plan | elevate → all true (FE) | SEL-001, ADM-003 |
| head_judge ≠ SUPER_ADMIN | Hardcoded admin-like set | RBAC-003 |
| Dual-read events legacy | Incomplete map | RBAC-004 |
| Dashboard store_id scoped | Query param trust | SEC-004 |

## Hardcoded / bypass patterns found

1. Soft-open create_event  
2. Empty sandbox allowlist  
3. FE fail-open entitlements  
4. JWT optional when ENVIRONMENT ≠ production  
5. head_judge in platform admin set  
6. confirm_result too broad  

## Endpoint sampling (mutators)

Priority fix list lives in SEC-001/SEC-002. Full OpenAPI matrix should be generated in RC2 Gate Sprint (automatable test: each role × each POST expect 403).

## Recommendation

Codify **negative tests** per role in CI. Treat PermissionService as single source; forbid `pass` on denied can_*.
