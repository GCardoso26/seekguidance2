# Product Analytics Roadmap

**Version:** 1.0.0  
**Status:** Active  
**Owner:** Product Analytics

---

## Phase 0 — Foundation (this delivery)

- Taxonomy, catalog, funnels, KPIs, dashboards specs  
- Health score + North Star + DQ + baseline  
- Architecture + context note  
- **No product features**

---

## Phase 1 — Beta 1 “Make events true”

| Item | Outcome |
|------|---------|
| BE↔FE allowlist parity | Stop silent drops |
| Dead-letter + DQ dashboards | Visibility |
| Checkout `context` disambiguation | Clean funnels |
| Search payload contract | Zero-results / latency |
| Idempotent `purchase` | Clean NSM |
| SQL NSM + Marketplace funnel views | Executive board |

---

## Phase 2 — Beta 2 instrumentation depth

| Item | Outcome |
|------|---------|
| SearchResultClicked / OfferViewed / CartOpened | Full marketplace funnel |
| Wishlist visit + persist all wish events | Wishlist funnel live |
| Seller signup/KYC analytics mirrors | Seller funnel |
| Deck create/save/share | Deck funnel |
| RUM Web Vitals | Perf component of PHS |
| Daily email/Slack Beta report | Cadence |

---

## Phase 3 — Qualitative & session intelligence

| Item | Notes |
|------|-------|
| **Heatmaps** | Privacy-reviewed; sample rates |
| **Session Replay** | PII masking mandatory; opt-in/region |
| Alerting | Wire BASELINE alert catalog |
| Anomaly Detection | Volume / conversion WoW |

Constraints: must not alter checkout UX; replay storage retention ≤ 30–90d.

---

## Phase 4 — Product Intelligence

| Item | Notes |
|------|-------|
| Daily / Weekly Product Intelligence digest | Auto narrative from KPIs |
| Segment insights (game, tier, device) | Marts |
| Seller liquidity recommendations | Ops, not auto-pricing |

---

## Phase 5 — Experimentation

| Item | Notes |
|------|-------|
| Experiment Engine | Assignment + exposure events |
| A/B Testing | Guardrails on NSM + error SLO |
| Feature flags analytics | Exposure ≠ conversion |

**Rule:** experiments require pre-registered primary metric from KPIS.md.

---

## Phase 6 — IA Analítica

| Item | Notes |
|------|-------|
| Natural-language ask over marts | Read-only SQL / semantic layer |
| Anomaly explanations | Cite metrics + funnels |
| Cost control | Tie to `cost-control` context; budget caps |

Must not invent metrics; must cite catalog definitions.

---

## Dependency order

```text
Foundation docs
  → Event truth (allowlist/DQ)
    → Funnel completeness
      → Dashboards live
        → Alerts / anomalies
          → Replay/heatmaps
            → Experiments
              → IA analítica
```

Skipping event truth invalidates every later phase.
