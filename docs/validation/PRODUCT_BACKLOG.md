# PRODUCT_BACKLOG.md — Post Product Validation 4.5

Derived from [BUG_REGISTRY.md](./BUG_REGISTRY.md). **Do not implement until report approval.**

## P0 — Blocks production / RC2

| ID | Item | Outcome |
|----|------|---------|
| BUY-001, BUY-014, BUY-009 | Replace all commerce `/login` with `/entrar?next=` | Auth funnel works for guests |
| BUY-002, BUY-011 | Standardize `next` (accept or migrate `redirect`) | Deep-link retention after login |
| SEC-001 | RBAC on financial_platform mutators (`store.finance.*` / admin) | Journals/payouts not world-writable |
| SEC-002, RBAC-001 | Harden tournament_platform writes; hard-403 `create_event` | Event integrity |
| ANA-01, ANA-02 | Persist BP2/BP3 `emit` into Event Registry + FE parity | Analytics truth |
| SEA-02 | Align search analytics payload field names | Funnel counts valid |
| PERF-01 | Budget + stabilize `/loja/busca` Lighthouse | Perf SLOs credible |
| FIN-01, JUD-001 | Document + gate dual wallet; cutover plan for checkout wiring | No false money UI |
| ADM-001 | Require non-empty sandbox allowlist | No accidental SUPER_ADMIN |

## P1 — High impact

| ID | Item |
|----|------|
| BUY-003, BUY-012 | Surface cart 401 → login; distinguish empty vs unauthorized |
| BUY-004 | Global CartDrawer / provider outside store-only shell |
| BUY-005 | CTA only when `store_product_id` present |
| BUY-006 | Email-confirm success state; persist `next` |
| SEL-001–003, ADM-002–003 | Sandbox elevation fail-closed; APP_MODE typo fail-closed |
| SEC-003–006 | Auth+RBAC on sensitive GETs; JWT policy by APP_MODE; confirm_result rules |
| RBAC-002 | Migrate tournament flow off `_require_organizer`-only |
| SEA-01, SEA-03 | Header search + emit gating analytics |
| FIN-02, FIN-03 | Label demo financeiro vs live PIX; surface `checkout_wired` |
| UX-01 | Disambiguate Loja vs Comprador mobile |
| PERF-02 | Reduce FacetedSearch client weight |

## P2 — Material improvements

Header comprador discoverability (BUY-007), wallet credentials (BUY-008), search error empty (BUY-010), store create auth UX (SEL-004), plan-locked cupons (SEL-005), dual-read events map (RBAC-004), health subject scoping (SEC-007), docs honesty (JUD-002, ANA-05), seed header trust (ADM-004).

## P3 — Polish

Smart Cart collapse default (BUY-013), legacy CreateListingForm (SEL-007), events empty PageEmpty (SEL-006), hydration watcher scope (PERF-03), SEA-04 zero-results CTA.

## P4 — Ideas (future)

- Unify wallet UX with Stripe/Shopify-grade trust patterns.
- Event Registry health score per runtime (tournament/financial).
- Competitive UX pass vs Cardmarket / ML (search+checkout only).
- Judge console mobile-first pairing UX overhaul.
- Single “money” surface for buyer (cashback + credit + wallet ledger).

## Suggested sprint sequencing (after approval)

1. **RC2-Sec:** SEC-001, SEC-002, RBAC-001, ADM-001, SEC-005  
2. **RC2-AuthFunnel:** BUY-001/002/011/014 + cart 401  
3. **RC2-AnalyticsTruth:** ANA-01/02 + SEA-02  
4. **RC2-TrustFinance:** FIN-01 labels + cutover design (no silent wiring)  
5. **RC2-PerfSearch:** PERF-01/02
