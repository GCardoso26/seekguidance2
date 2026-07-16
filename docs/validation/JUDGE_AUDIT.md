# JUDGE_AUDIT.md

**Personas:** Juiz · Head Judge · Organizador  
**Flows:** Entrar evento → Check-in → Pairings → Report match → Penalty → Deck check → Standings → Finalize

## Journey verdict

Operational **UI/shells exist** (seller events, player event, tournament ops dashboards). **Authorization model does not match the PermissionService matrix**: tournament_platform writes are primarily “any authenticated user,” and legacy flow still uses organizer-created_by checks. Soft-open `create_event` breaks organizer exclusivity.

## Flow findings

| Step | Risk | IDs |
|------|------|-----|
| Create event / tournament | Soft-open on deny | RBAC-001 |
| Staff assignment / penalties | IDOR-class writes | SEC-002 |
| Check-in / pairings / rounds | Auth weak on writes; docs overclaim | SEC-002, JUD-002 |
| Report / confirm result | Broad confirm_result | SEC-006 |
| Sensitive dashboards (standings ops) | Unauth/weak GETs | SEC-003 |
| Deck check / penalties | Same write gate gap | SEC-002 |
| Premiação / encerrar | Coupled to financial façade not checkout | JUD-001 |

## Head Judge vs Judge

- Identity platform hardcodes `head_judge` into platform-admin-like set (RBAC-003) — matrix bypass risk.
- Dual-read LEGACY events roles incomplete (RBAC-004).

## Recommendations

1. All mutators: `PermissionService.can` + resource scope (event_id/store_id).  
2. Remove `pass` on create_event deny.  
3. Align docs with actual wiring.  
4. Separate HJ admin from SUPER_ADMIN.
