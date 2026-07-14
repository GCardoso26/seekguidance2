# Analytics Baseline — Public Beta Day-0

**Version:** 1.0.0  
**Status:** Active  
**Owner:** Product Analytics  
**As-of:** Public Beta (post-RC1)

Even with low/zero traffic, baselines lock **definitions, floors, SLOs, and future alerts**.

---

## 1. Metric baselines (product)

| Metric | Day-0 baseline | Beta 1 target | Beta 2 stretch | Notes |
|--------|----------------|---------------|----------------|-------|
| Completed Orders 7d (NSM) | 0–N observed | Establish >0 sustainable | Growth MoM | Filter test accounts |
| Active sellers w/ sale 7d | observe | ≥ 3 | ≥ 15 | Guardrail |
| Active buyers w/ purchase 7d | observe | ≥ 5 | ≥ 40 | Guardrail |
| GMV 7d | observe | Directional up | — | Finance align |
| AOV | observe | Stable ±30% | — | Outlier watch |
| Search→Order conversion | N/A until volume | ≥ 1% | ≥ 2% | Min 100 searches |
| Cart abandonment | observe | ≤ 70% | ≤ 55% | Context=marketplace |
| Zero-results rate | observe | ≤ 25% | ≤ 15% | Needs payload |
| Wishlist create→convert | N/A (blocked) | Instrument first | ≥ 10% | |
| WAU buyers | observe | +WoW | — | |
| D7 retention | observe | ≥ 15% | ≥ 25% | |

---

## 2. SLIs / SLOs (platform — feed Product Health)

Aligned with release/monitoring/performance context; analytics consumes them.

| SLI | SLO (Beta) | Alert (future) |
|-----|------------|----------------|
| API availability (critical) | ≥ 99.5% rolling 30d | < 99% 1h |
| API 5xx rate | < 1% | > 2% for 15m |
| Checkout page LCP (lab/prod) | ≤ 2.0s / Perf ≥ 95 | Regression vs RC1 |
| Store search LCP | ≤ 2.0s / Perf ≥ 95 | Regression |
| Analytics ingest success | ≥ 99% accepted of valid | < 95% 1h |
| Unknown-event drop rate | < 0.5% after allowlist fix | > 2% |
| Event lag (ingest→queryable) | < 15 min P95 | > 60 min |

---

## 3. Analytics pipeline thresholds

| Threshold | Value | Action |
|-----------|-------|--------|
| Queue flush size | 10 or immediate set | Existing FE |
| Immediate flush events | checkout_*, purchase, add_to_cart, paywall_hit | Existing |
| Soft-200 on track | Keep for UX | Log server failures for DQ |
| Raw retention | 400d | Archive aggregates |
| Min sample for rate KPIs | 100 events / 7d | Else “insufficient data” |

---

## 4. Alert classes (not wired yet — catalog only)

| ID | Condition | Severity |
|----|-----------|----------|
| A-NSM-DROP | Orders 7d −50% WoW after volume floor | P1 |
| A-FUNNEL-CHECKOUT | Checkout→Order −20% WoW | P1 |
| A-SEARCH-ZERO | Zero-results >35% daily | P2 |
| A-DQ-DROP | Unknown drop >2% | P0 |
| A-PHS | Product Health <50 | P0 |
| A-PERF | Critical route Perf <95 lab | P1 |

---

## 5. How to refresh baseline

1. Snapshot weekly CSV of NSM + KPIs.  
2. After each Beta cohort wave, recalibrate targets (never silently).  
3. Bump this doc version when targets change.
