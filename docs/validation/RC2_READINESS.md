# RC2_READINESS.md

**Verdict: NO-GO for RC2 production confidence**  
**Date:** 2026-07-15 · Program 4.5 validation

## Gate definition

RC2 is ready when all **P0** items in [BUG_REGISTRY.md](./BUG_REGISTRY.md) are closed **or** explicitly waived with signed risk acceptance. P1 security items (SEC-003+) should be closed or time-boxed with compensating controls.

## Gate checklist

| Gate | Pass? | Evidence |
|------|:-----:|----------|
| Guest → login → intended destination | ❌ | BUY-001, BUY-002 |
| Cart auth failures honest | ❌ | BUY-003 |
| Tournament create cannot soft-open | ❌ | RBAC-001 |
| Tournament writes RBAC-enforced | ❌ | SEC-002 |
| Financial writes RBAC-enforced | ❌ | SEC-001 |
| Sandbox elevation allowlisted | ❌ | ADM-001 |
| Wallet UI does not imply live checkout money | ❌ | FIN-01, JUD-001, FIN-03 |
| Platform analytics events persist | ❌ | ANA-01 |
| Search analytics contract green | ❌ | SEA-02 |
| Search cold Perf within budget | ❌ | PERF-01 |
| Sensitive dashboards auth+scope | ❌ | SEC-003, SEC-004 |
| JWT spoof impossible outside intentional local only | ⚠️ | SEC-005 (non-prod policy) |

## What *is* ready (keep)

- Additive identity / tournament / financial **packages** exist with dual-read RC1 intent documented.
- Header BP3.5 simplification (Comprar removed) is coherent on desktop header.
- Seller dashboard surface area is broad (products, CSV, analytics, events shells).
- Design system primitives (`PageEmpty`, shells) available for remediation.

## Exit criteria for next review

1. Zero open P0 in BUG_REGISTRY.  
2. SECURITY_AUDIT residual risk list ≤ 3 waived items.  
3. Lighthouse cold `/loja/busca` median ≥ agreed budget (propose ≥90 Perf **or** honest docs).  
4. Event Registry ingest path validated with fixture test for tournament + financial emits.  
5. Product sign-off that wallet screens show “demo / not checkout” until wired.

## Recommendation

Treat **Business Program 4.5** as diagnostic complete. Next program should be **RC2 Gate Sprint** (sec + auth funnel + analytics truth), not more platforms.
