# SECURITY_AUDIT.md

**Scope:** RBAC, IDOR, CSRF posture, feature flags, sandbox, escrow/wallet, uploads, endpoints. No exploit PoCs produced.

## P0 threats

| ID | Threat | Impact |
|----|--------|--------|
| SEC-001 | Any authed user posts financial journals/payouts | Fraud / ledger poison |
| SEC-002 | Any authed user mutates tournament staff/penalties/regs | Tournament integrity loss |
| RBAC-001 | Event creation soft-open | Spam / store contamination |
| ADM-001 | Sandbox empty allowlist → SUPER_ADMIN | Privilege flood |

## P1 threats

SEC-003 sensitive GETs, SEC-004 cross-store reads, SEC-005 JWT spoof non-prod config, SEC-006 confirm_result abuse, SEL-002 FE fail-open, ADM-002 APP_MODE typo.

## CSRF / session notes

- Cookie/JWT patterns depend on FE BFF; cart 401 masking (BUY-003) is UX but also hides session expiry signals useful for security awareness.
- Prefer SameSite + explicit auth on all mutating `/runtime/*` routes.

## Escrow / Wallet

- Financial platform ledger is **not** escrow for checkout (JUD-001). Marketing or UI that implies custody is a **trust/security messaging** issue until wired with scoped RBAC.

## Uploads

- Not exhaustively file-scanned this sprint; flag CSV import + media paths for malware/content-type review in RC2 Gate (P2 if unscoped).

## Recommendations

Immediate: lock mutators + allowlist + soft-open remove. Then: automated IDOR suite. Waive nothing P0 without signed risk.
