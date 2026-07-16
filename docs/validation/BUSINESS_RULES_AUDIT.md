# BUSINESS_RULES_AUDIT.md

## Method

Question every charge, subscription, checkout, commission, prize, registration, wallet, permission policy against code evidence.

## Inconsistencies

| Rule intent | Observed | Impact | IDs |
|-------------|----------|--------|-----|
| Only organizers create events | Soft-open | Events anywhere | RBAC-001 |
| Wallet balances drive checkout | Dual unrelated systems / unwired | False trust | FIN-01, JUD-001 |
| Plan features gate seller modules | Sandbox elevation all-on FE | Paid feature leakage in UI | SEL-001 |
| Staff/events permissions matter | Organizer-created_by path | Role matrix dead | RBAC-002 |
| Search analytics honest | Wrong field / missing emits | KPI lies | SEA-02, ANA-01 |
| Guest must use buyer login | CTAs to admin `/login` | Broken acquisition | BUY-001 |
| Listings for sale are purchaseable | CTA without store_product_id | Dead funnel | BUY-005 |
| Sandbox limited to allowlist | Empty → everyone | Ops/security rule break | ADM-001 |
| HJ elevated carefully | hardcode admin set | Over-privilege | RBAC-003 |
| Platform analytics covers tournaments/finance | logger-only emit | North Star blind | ANA-01 |

## Policies needing product decisions (before code)

1. Is financial platform demo indefinitely or hard cutover date?  
2. Is APP_MODE=development allowed on shared staging?  
3. Are manager/staff meant to run events without being creator?  
4. Is `/login` deprecated forever? (assumed yes)

## Acceptance for “rules healthy”

All rows above resolved or documented as intentional with UI honesty (e.g. “Demo wallet”).
