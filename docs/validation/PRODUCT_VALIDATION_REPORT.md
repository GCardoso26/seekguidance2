# PRODUCT_VALIDATION_REPORT.md — Business Program 4.5

**Status:** AUDIT ONLY — no product code changes  
**Date:** 2026-07-15  
**Product:** JudgeTCG (`S:\tcg-judge`, branch assumptions: post BP1–3.5)

## Executive verdict

JudgeTCG is **not RC2-ready** for a trusted multi-role marketplace + tournament + wallet story. Core shopping UX has critical auth/cart conversion breaks. Tournament and financial “platforms” expose write paths that are effectively **open to any authenticated user** (or soft-open create_event). Analytics Event Registry claims for BP2/BP3 are largely **observability theater** (`emit` → logger). Search performance evidence contradicts polished release narrative on cold `/loja/busca`.

**RC2 readiness:** **NO-GO** until P0 security + auth funnel + analytics persistence + single financial truth path are addressed. See [RC2_READINESS.md](./RC2_READINESS.md).

## Method

| Layer | Approach |
|-------|----------|
| Personas | Buyer, Buyer PRO, recurring, new, seller, owner, manager, staff, judge, HJ, organizer, admin, SUPER_ADMIN, sandbox |
| Technique | Static/code-path journey audit + prior CI Lighthouse artifacts + RBAC matrix review |
| Out of scope this sprint | Implementing fixes, live prod traffic farming, exploit PoCs |
| Artifacts | `docs/validation/*` + `context/business-program-4.5.md` |

## Scorecard (0–10)

| Domain | Score | One-liner |
|--------|------:|-----------|
| Buyer conversion | 3 | `/login` vs `/entrar`, cart 401 silent empty |
| Seller ops | 5 | Shell rich; plan gates & discovery muddled in sandbox |
| Tournament integrity | 2 | Soft-open create + IDOR-class writes |
| Judge ops | 4 | Flows exist; authz not PermissionService |
| Financial trust | 2 | Dual wallet; not wired to checkout; open mutators |
| Admin / Sandbox | 4 | Powerful DX; empty allowlist = everyone elevated |
| Search | 5 | Good surface; analytics contract bugs; cold Perf debt |
| Analytics health | 2 | BP2/3 emit not persisted; typed ghosts |
| Performance | 4 | Cold search Lighthouse ~80 vs narrative |
| Security / RBAC | 2 | Multiple P0 IDOR / soft-open |
| UI system | 6 | DS exists; spacing/overflow/nav debt |
| Overall product trust | **2.5** | Ship RC2 only after P0 clearance |

## Critical findings (top 10)

1. **BUY-001 / BUY-014** — Commerce CTAs → `/login` (admin), not `/entrar`.
2. **BUY-002** — `redirect=` vs `next=` breaks post-auth deep links.
3. **SEC-001** — Financial platform journals/payouts: auth-only.
4. **SEC-002 / RBAC-001** — Tournament writes + soft-open `create_event`.
5. **FIN-01 / JUD-001** — Identity wallet vs `fin_*` façade; checkout unwired.
6. **ANA-01** — Tournament/financial `emit()` does not hit Event Registry storage.
7. **SEA-02** — Search analytics `results_count` vs `result_count` contract break.
8. **PERF-01** — `/loja/busca` cold Lighthouse unstable ~80.
9. **ADM-001** — Empty `SANDBOX_ADMIN_EMAILS` elevates all authed users.
10. **BUY-003 / BUY-004** — Cart 401 as empty; drawer missing outside store shell.

## Persona coverage

| Persona | Primary audits | Status |
|---------|----------------|--------|
| Comprador / PRO / recorrente / novo | BUYER_AUDIT | Covered |
| Lojista / dono / gerente / staff | SELLER_AUDIT | Covered |
| Juiz / Head Judge / Organizer | JUDGE_AUDIT + tournament sections | Covered |
| Admin / SUPER_ADMIN / Sandbox | ADMIN_AUDIT | Covered |

## Deliverables index

| File | Purpose |
|------|---------|
| [BUG_REGISTRY.md](./BUG_REGISTRY.md) | Canonical bug list |
| [PRODUCT_BACKLOG.md](./PRODUCT_BACKLOG.md) | P0–P4 backlog |
| [BUYER_AUDIT.md](./BUYER_AUDIT.md) | Buyer journeys |
| [SELLER_AUDIT.md](./SELLER_AUDIT.md) | Seller journeys |
| [JUDGE_AUDIT.md](./JUDGE_AUDIT.md) | Judge / tournament ops |
| [ADMIN_AUDIT.md](./ADMIN_AUDIT.md) | Sandbox / runtimes |
| [RBAC_AUDIT.md](./RBAC_AUDIT.md) | Permissions |
| [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) | Threat-oriented |
| [BUSINESS_RULES_AUDIT.md](./BUSINESS_RULES_AUDIT.md) | Rules inconsistencies |
| [SEARCH_AUDIT.md](./SEARCH_AUDIT.md) | Search & discovery |
| [UX_AUDIT.md](./UX_AUDIT.md) / [UI_AUDIT.md](./UI_AUDIT.md) | Experience / visual |
| [PERFORMANCE_AUDIT.md](./PERFORMANCE_AUDIT.md) | Perf |
| [FEATURE_REGISTRY.md](./FEATURE_REGISTRY.md) | What exists vs marketed |
| [TECH_DEBT.md](./TECH_DEBT.md) | Structural debt |
| [RC2_READINESS.md](./RC2_READINESS.md) | Go / no-go gates |
| [../context/business-program-4.5.md](../context/business-program-4.5.md) | Program context |

## Explicit non-goals of this sprint

- No patches for BUY-/SEC-/ANA-/PERF- IDs.
- No new Business Program features.
- Implementation only after stakeholder approval of this report.

## Recommended next step

1. Stakeholder review of P0 table in BUG_REGISTRY.  
2. Approve P0 security + auth funnel sprint (call it **RC2 Gate Sprint**).  
3. Only then implement from PRODUCT_BACKLOG P0 → P1.
