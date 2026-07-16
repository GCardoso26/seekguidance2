# Business Program 4.5 — Product Validation

**Date:** 2026-07-15  
**Mode:** Audit only — **no product code changes**  
**Repo:** JudgeTCG / `tcg-judge`

## Intent

Act as Principal QA / PM / UX / Business Auditor. Simulate persona journeys across buyer, seller, tournament, judge, admin/sandbox. Produce diagnosis, bug registry, and prioritized backlog. Implementation only after report approval.

## Inputs

- Code on `main` after Business Programs 1 (Identity), 2 (Tournament Platform), 3 (Financial Platform), 3.5 (UX & Admin Sandbox).  
- Systematic persona × flow code-path audits (not live browser farms of “hundreds of users”).

## Outputs

All under `docs/validation/`:

- `PRODUCT_VALIDATION_REPORT.md` — executive verdict  
- `BUG_REGISTRY.md` — canonical issues  
- `PRODUCT_BACKLOG.md` — P0–P4  
- `RC2_READINESS.md` — **NO-GO**  
- Domain audits: BUYER, SELLER, JUDGE, ADMIN, RBAC, SECURITY, BUSINESS_RULES, SEARCH, UX, UI, PERFORMANCE  
- `FEATURE_REGISTRY.md`, `TECH_DEBT.md`

Canvas: `product-validation-4-5.canvas.tsx` (workspace canvases) for scoreboard UI.

## Explicit non-goals

- Implementing BUG_* fixes in this program  
- New platform features  
- Claiming RC2 ready

## Next program (proposed)

**RC2 Gate Sprint:** SEC-001/002, RBAC-001, ADM-001, BUY-001/002, ANA-01, SEA-02, FIN honesty labels.

## Acceptance (program 4.5)

- [x] Flows / personas audited (code-path)  
- [x] Permissions / dashboards / runtimes / events / KPIs / health called out  
- [x] Backlog + Bug Registry + RC2 readiness produced  
- [ ] Stakeholder approval of report (external)  
- [ ] Implementation (blocked until approval)
