# MATERIALIZED_DATA_MARTS.md

**Version:** 1.0.0  
**Module:** `analytics_runtime.marts` + `materializers`

| Mart | Contents |
|------|----------|
| mart_orders | orders_completed, gmv, aov |
| mart_search | searches, ctr, zero_results, success |
| mart_conversion | conversion_rate, checkout funnel |
| mart_buyers | active buyers, sessions, wishlist |
| mart_sellers | active sellers, listings |
| mart_catalog | catalog counts by game |
| mart_product_health | PHS pillars + AHS |
| mart_north_star | orders_7d + guardrails |
| mart_funnels | marketplace/checkout/search/wishlist/deck/seller/judge |
| mart_cohorts | D1–D90 + segments |
| mart_alerts | structured alert items |

Optional persistence table (additive): `tcg_judge.analytics_runtime_mart_snapshots`.
