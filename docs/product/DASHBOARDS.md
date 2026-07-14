# Dashboards — Product Analytics (Design Spec)

**Version:** 1.0.0  
**Status:** Spec only — **no charts implemented** in this foundation  
**Owner:** Product Analytics  
**Priority key:** P0 = Beta week-1 · P1 = Beta month-1 · P2 = Beta 2+

Each dashboard lists: Widgets · Data origin · Refresh · Owner · Priority.

---

## 1. Dashboard Executivo

**Audience:** Leadership · **Owner:** Product Analytics · **Priority:** P0

| Widget | Origin | Refresh |
|--------|--------|---------|
| North Star (Orders completed / Liquidity index) | Domain + KPIs | 1h |
| GMV (today / 7d / 30d) | Orders | 1h |
| Orders + AOV | Orders | 1h |
| Product Health Score | Composite | 1h |
| Conversion Search→Order | Events + orders | 6h |
| Active Buyers / Sellers (WAU) | Events / domain | 6h |
| Top incidents / error burn | Monitoring | 15m |
| Funnel drop heatmap (marketplace) | Events | Daily |

---

## 2. Dashboard Produto

**Owner:** Product · **Priority:** P0

| Widget | Origin | Refresh |
|--------|--------|---------|
| Feature adoption matrix | Events by domain | Daily |
| Funnel Marketplace steps | Events | 6h |
| Wishlist / Deck readiness badges | DQ status | Daily |
| Event volume by name | analytics_events | 1h |
| Dead / dropped event rate | DQ | 1h |
| New vs returning users | Events | Daily |

---

## 3. Dashboard Marketplace

**Owner:** Marketplace · **Priority:** P0

| Widget | Origin | Refresh |
|--------|--------|---------|
| GMV / Orders / AOV | Domain | 1h |
| Funnel Landing→Order | Events | 6h |
| Cart & Checkout abandonment | Events | 6h |
| Top converting cards | Events + orders | Daily |
| Top sellers by GMV | Orders | Daily |
| Category conversion | Catalog + orders | Daily |

---

## 4. Dashboard Search

**Owner:** Search · **Priority:** P0

| Widget | Origin | Refresh |
|--------|--------|---------|
| Search volume | `search` | 1h |
| Zero-results rate | `search` payload | 1h |
| P50/P95 query latency | API / events | 15m |
| Popular terms | Events | Daily |
| CTR (when ready) | SearchResultClicked | 6h |
| Filter usage (when ready) | SearchFilterApplied | Daily |

---

## 5. Dashboard Wishlist

**Owner:** Buyer · **Priority:** P1 (blocked until allowlist)

| Widget | Origin | Refresh |
|--------|--------|---------|
| Lists created / shared | Wish events | 6h |
| Visit → convert | Wish funnel | Daily |
| Wishlist→GMV | Attribution | Daily |
| Time to purchase | Events + orders | Daily |

---

## 6. Dashboard Checkout

**Owner:** Marketplace · **Priority:** P0

| Widget | Origin | Refresh |
|--------|--------|---------|
| Checkout started vs completed | Events (context=marketplace) | 1h |
| Payment method mix | Domain | 6h |
| Failure reasons | `checkout_failed` / logs | 15m |
| Time in checkout | Events / RUM | Daily |
| SaaS vs Marketplace split | Event properties | Daily |

---

## 7. Dashboard Sellers

**Owner:** Seller · **Priority:** P1

| Widget | Origin | Refresh |
|--------|--------|---------|
| Signup → KYC → listing | Domain + events | Daily |
| First sale rate 30d | Orders | Daily |
| Active listings | Inventory | 6h |
| Sell-through | Inventory + orders | Weekly |
| Price change frequency | Events ★ | Weekly |

---

## 8. Dashboard Buyers

**Owner:** Buyer · **Priority:** P1

| Widget | Origin | Refresh |
|--------|--------|---------|
| DAU/WAU/MAU | Events | Daily |
| Retention curves | Cohorts | Weekly |
| Repeat purchase rate | Orders | Weekly |
| Recommendation CTR | Events | Daily |

---

## 9. Dashboard Performance

**Owner:** Platform · **Priority:** P0

| Widget | Origin | Refresh |
|--------|--------|---------|
| Lighthouse critical routes | CI / prod lab | Per deploy |
| LCP/INP/CLS (RUM when live) | RUM | 1h |
| API P95 latency | OTel | 5m |
| Core web vitals vs SLO | Perf docs | Daily |

---

## 10. Dashboard Errors

**Owner:** Platform · **Priority:** P0

| Widget | Origin | Refresh |
|--------|--------|---------|
| Error rate / burn rate | Monitoring | 1m |
| Top exceptions | Logs | 5m |
| Client `image_failure` volume | Events (after persist) | 1h |
| Analytics ingest errors | Pipeline | 5m |

---

## 11. Dashboard Inventory

**Owner:** Seller Ops · **Priority:** P1

| Widget | Origin | Refresh |
|--------|--------|---------|
| Live SKU count | Inventory | 1h |
| Out-of-stock rate | Inventory | 6h |
| Aged inventory | Inventory | Weekly |
| Sell-through by game | Domain | Weekly |

---

## 12. Dashboard Revenue

**Owner:** Finance / Growth · **Priority:** P0

| Widget | Origin | Refresh |
|--------|--------|---------|
| GMV vs Net revenue | Finance | Daily |
| SaaS MRR / churn proxies | Subscriptions | Daily |
| Take rate | Finance | Weekly |
| Refunds / disputes impact | Domain | Daily |

---

## Implementation note

Dashboards will initially be **SQL views / Metabase / Looker / Grafana** (choice TBD). This foundation forbids shipping chart UI into the product app without measurement-first approval.
