# AGGREGATION_ENGINE.md

**Version:** 1.0.0  
**Module:** `analytics_runtime.aggregators`

Incremental `AggregationState` derives:

- Orders / GMV / buyers / sellers (prefer domain orders)
- Sessions / DAU proxy
- Search / CTR proxies / zero-results
- Wishlist / checkout / purchase event counts

Window default: **7 days**. Near-real-time rematerialization via scheduler + `POST /runtime/analytics/materialize`.
