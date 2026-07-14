# Product Analytics Foundation — Public Beta

**Version:** 1.0.0  
**Status:** COMPLETE (documentation foundation)  
**Date:** 2026-07-14  
**Role:** Product Analytics Engineer  
**Constraint:** Additive / observational only — no business features, no API/CQRS/UI rule changes in this workstream.

---

## Verdict

JudgeTCG entered Public Beta after RC1. Product Analytics foundation is **documented and audited**.  
**Event pipeline is partially truthful:** monetization + core marketplace events persist; many Buyer Experience and orphan events are **emitted then dropped** by backend allowlist. North Star and Health Score are defined; dashboards are specified but not implemented.

---

## Deliverables

| Doc | Path |
|-----|------|
| Event Taxonomy | `docs/product/EVENT_TAXONOMY.md` |
| Event Catalog | `docs/product/EVENT_CATALOG.md` |
| Funnels | `docs/product/FUNNELS.md` |
| KPIs | `docs/product/KPIS.md` |
| Dashboards | `docs/product/DASHBOARDS.md` |
| Product Health | `docs/product/PRODUCT_HEALTH.md` |
| North Star | `docs/product/NORTH_STAR.md` |
| Data Quality | `docs/product/DATA_QUALITY.md` |
| Baseline | `docs/product/BASELINE.md` |
| Architecture | `docs/product/PRODUCT_ANALYTICS_ARCHITECTURE.md` |
| Roadmap | `docs/product/PRODUCT_ANALYTICS_ROADMAP.md` |
| This context | `context/product-analytics-foundation.md` |

---

## North Star (locked)

**Completed Orders (7d)** with two-sided guardrails (active selling sellers + purchasing buyers in the same window).  
Rationale: domain-grounded, hard to fake with empty traffic, validates marketplace under Beta.

---

## Critical gaps (must fix before trusting product charts)

1. ~~BE allowlist excludes BuyerExperience~~ → **FIXED in Beta 1.5** (registry + DLQ).  
2. ~~No event_schema_version~~ → **FIXED** (v1).  
3. Checkout SaaS vs marketplace ambiguity (`context` prop) — remaining.  
4. Missing P0 emits: SearchResultClicked, OfferViewed, CartOpened, WishlistVisited, seller KYC, deck lifecycle.  
5. ~~Purchase idempotency absent~~ → **SDK + unique index** (apply migration).  
6. Soft-200 track — HTTP soft remains; **body now truthful** (`ok`/`lost`).

See: `context/beta1.5-event-integrity.md`.

---

## Principle locked for Beta

> Nenhuma funcionalidade deve ser implementada sem antes existir uma forma de medi-la.

Catalog P0 + destination required before feature merge.

---

## Next engineering (out of this doc sprint)

1. Allowlist parity + dead-letter  
2. SQL marts for NSM + marketplace funnel  
3. Search payload contract  
4. Wire dashboard tooling (Metabase/Grafana TBD)

---

## Related context

- `context/11- release/telemetry.md`  
- `context/11- release/monitoring.md`  
- `context/11- release/observability.md`  
- `context/11- release/beta-plan.md`  
- `context/RC1_RELEASE_COMPLETED.md` (if present)  
- FE: `frontend/runtime_console_v3/src/lib/analytics.ts`  
- BE: `services/api/app/judge/analytics_events.py`
