# Official KPIs — JudgeTCG Public Beta

**Version:** 1.0.0  
**Status:** Active  
**Owner:** Product Analytics  
**North Star:** see [NORTH_STAR.md](./NORTH_STAR.md)

All KPIs must be computable from: product events, domain tables (orders), or platform SLOs.  
**Beta rule:** if a KPI cannot be computed, it is marked **BLOCKED** until instrumentation exists.

---

## Marketplace

| KPI | Definition | Source | Cadence | Status |
|-----|------------|--------|---------|--------|
| **GMV** | Sum of paid order totals (gross) | Orders / payments | Daily | Computable (domain) |
| **Orders** | Count paid/completed orders | Orders | Daily | Computable |
| **Revenue** | Net take-rate / fees recognized | Finance | Daily | Domain / finance |
| **Conversion** | Orders ÷ unique searchers (7d) | `search` + orders | Daily | Partial (events OK) |
| **Cart Rate** | Sessions with add_to_cart ÷ sessions with card_view | Events | Daily | Partial |
| **Checkout Rate** | checkout_started ÷ add_to_cart sessions | Events | Daily | Partial (context mix) |
| **Abandonment** | 1 − (purchase ÷ checkout_started) marketplace | Events | Daily | Partial |
| **AOV** | GMV ÷ Orders | Domain | Daily | Computable |

---

## Search

| KPI | Definition | Source | Status |
|-----|------------|--------|--------|
| **CTR** | Clicks on results ÷ searches | Needs `SearchResultClicked` | **BLOCKED** |
| **Zero Results** | Searches with 0 hits ÷ searches | `search` payload | **BLOCKED** until field enforced |
| **Avg Query Time** | Mean/P95 `latency_ms` | `search` / RUM / API | Partial (API possible) |
| **Popular Terms** | Top queries by volume | `search.query` | Partial |

---

## Wishlist

| KPI | Definition | Source | Status |
|-----|------------|--------|--------|
| **Usage** | Unique creators / WA Us creating lists | `wishlist_created` | **BLOCKED** (dropped) |
| **Conversion** | Converted lists ÷ created | wish events | **BLOCKED** |
| **Time to Purchase** | Share → purchase median | events + orders | **BLOCKED** |

---

## Seller

| KPI | Definition | Source | Status |
|-----|------------|--------|--------|
| **First Sale** | % new sellers with ≥1 sale in 30d of KYC | Domain | Partial |
| **Retention** | Sellers with sale in week N and N+4 | Orders | Computable |
| **Inventory Sell-through** | Units sold ÷ units listed (period) | Inventory + orders | Domain |
| **Active Sellers** | Sellers with ≥1 live listing | Inventory | Computable |

---

## Buyer

| KPI | Definition | Source | Status |
|-----|------------|--------|--------|
| **DAU / WAU / MAU** | Distinct `user_id` or anon with ≥1 `page_view` | Events | Partial |
| **Buyer Retention** | D1/D7/D30 return | Events / auth | Partial |
| **Cohorts** | Signup week × retained / purchased | Auth + orders | Computable (domain) |

---

## Deck Builder

| KPI | Deck create→save→shop→purchase rates | Status: **BLOCKED** |

---

## Platform quality (feeds Product Health)

| KPI | Definition | Source |
|-----|------------|--------|
| Availability | Successful probes / total | Monitoring |
| Error rate | 5xx ÷ requests (API) | Monitoring |
| Perf gate | Routes meeting Perf≥95 / LCP SLO | Lighthouse / RUM |
| Analytics freshness | Max event lag minutes | Pipeline |

---

## KPI governance

1. Each KPI has a single **definition owner** (Product Analytics).
2. Formula changes require version bump in this file.
3. Dashboard widgets must cite KPI id (e.g. `mkt.gmv`, `search.ctr`).
4. Beta baselines and targets: [BASELINE.md](./BASELINE.md).
