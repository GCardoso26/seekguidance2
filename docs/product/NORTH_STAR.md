# North Star Metric — JudgeTCG Public Beta

**Version:** 1.0.0  
**Status:** Active  
**Owner:** Product Analytics + Product Leadership  
**Review:** End of Beta 1

---

## Decision

**North Star Metric (NSM):**  
### Marketplace Liquidity — *Weekly Successful Orders with Cross-Side Activity*

**Operational definition (v1):**

\[
\text{NSM} = \text{Completed Orders}_{7d}
\]

**with guardrail that both sides are alive:**

- ≥ \(S_{\min}\) distinct **sellers** with ≥1 sale in the same 7d window  
- ≥ \(B_{\min}\) distinct **buyers** with ≥1 purchase in the same 7d window  

Report NSM as:

```text
Completed_Orders_7d | Active_Selling_Sellers_7d | Active_Buyers_7d
```

Primary chartable single number for the Beta scoreboard: **Completed Orders (7d)**.  
Liquidity guardrails are shown beside it (not merged into an opaque index for the headline).

---

## Why this (not the alternatives)

| Candidate | Pros | Cons | Verdict |
|-----------|------|------|---------|
| GMV | Money narrative | Sensitive to AOV outliers; payment timing | Guardrail, not NSM |
| Active buyers | Easy | Can rise without marketplace success | Leading indicator only |
| Active sellers | Supply health | Vanity if no sales | Guardrail |
| Search→Purchase conversion | Product quality | Volume-dependent; instrument gaps | Supporting KPI |
| Marketplace Liquidity (orders + two-sided) | Aligns buyer+seller value; hard to game with empty traffic | Needs reliable order truth | **Chosen** |

**Technical justification:**

1. Orders completed are **grounded in domain of record** (not solely client analytics), surviving FE drop bugs.
2. Two-sided guardrails prevent celebrating one-sided growth (many browsers, no sellers — or listings with zero buys).
3. Compatible with GMV/AOV dashboards without replacing finance metrics.
4. Maps 1:1 to Marketplace funnel last step (`purchase` / order paid).
5. Public Beta goal in `beta-plan` is validating business flows under real usage — completed orders are the strongest flow proof.

---

## Counter-metrics (anti-gaming)

| Counter | Why |
|---------|-----|
| Refund / dispute rate | Quality of orders |
| Fake / test order filter | Exclude internal accounts |
| Time-to-first-order for new sellers | Onboarding health |
| Search zero-results | Demand friction |
| Checkout abandonment | Leak detection |

---

## Targets

See [BASELINE.md](./BASELINE.md). NSM targets escalate by Beta phase; day-0 baseline may be near zero and still valid.

---

## Ownership

- **Metric definition:** Product Analytics  
- **Data correctness (orders):** Marketplace / Payments  
- **Weekly readout:** Product Lead in Beta review
