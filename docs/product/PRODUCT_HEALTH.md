# Product Health Score

**Version:** 1.0.0  
**Status:** Active (definition)  
**Owner:** Product Analytics  
**Range:** 0–100

---

## Purpose

Single composite index for Public Beta health of the **product** (not only infra uptime).  
Used on Executive Dashboard and weekly Beta review.

---

## Formula

\[
\text{PHS} = 100 \times \sum_{i} w_i \cdot n_i
\]

where \(n_i \in [0,1]\) is the normalized score for component \(i\), and \(\sum w_i = 1\).

### Weights (v1)

| Component | Weight \(w\) | What it measures |
|-----------|--------------|------------------|
| Conversion | 0.25 | Marketplace Search→Order vs baseline |
| Performance | 0.15 | Share of critical routes meeting Perf/LCP SLO |
| Errors | 0.15 | Inverse of API 5xx / client fatal rate vs SLO |
| Availability | 0.15 | Probe success rate |
| Satisfaction | 0.10 | Feedback / CSAT / dispute rate (proxy until survey) |
| Retention | 0.10 | WAU retention / D7 buyer return |
| Usage | 0.10 | WAU growth vs baseline floor |

**v1.0 justification:** Conversion dominates because Public Beta success is marketplace liquidity; platform pillars (perf/errors/availability) share equal footing; soft signals smaller until instruments mature.

---

## Normalization (\(n_i\))

### Conversion \(n_c\)
- Let \(c\) = Search→Order rate (7d).
- Let \(c^*\) = baseline target (see BASELINE).
- \(n_c = \mathrm{clamp}(c / c^*, 0, 1)\). If searches < threshold, mark component **N/A** and reweight remaining.

### Performance \(n_p\)
- Fraction of critical routes with lab Perf ≥ 95 and LCP ≤ SLO.

### Errors \(n_e\)
- \(n_e = \mathrm{clamp}(1 - e/e_{\max}, 0, 1)\) where \(e\) is 5xx rate, \(e_{\max}\) = error SLO ceiling.

### Availability \(n_a\)
- Probe success rate / availability SLO (capped at 1).

### Satisfaction \(n_s\)
- Proxy v1: \(1 - \min(1, disputes/orders)\); later replace with CSAT.

### Retention \(n_r\)
- D7 retained buyers / target.

### Usage \(n_u\)
- \(\mathrm{clamp}(WAU / WAU_{\min}, 0, 1)\).

---

## Bands

| Score | Band | Action |
|-------|------|--------|
| 85–100 | Healthy | Normal cadence |
| 70–84 | Watch | Weekly deep dive |
| 50–69 | Degraded | Root-cause + Beta guardrails |
| <50 | Critical | Freeze feature work; fix measurement/flow |

---

## Cadence

- Computed hourly for ops glance; **reported daily** in Beta standup.
- Weight changes require Product + Platform approval and version bump.

---

## Dependencies / honesty

Until Wishlist/Search CTR events persist, PHS **excludes incomplete funnels from conversion** or uses domain-only conversion (orders ÷ active buyers) as fallback with flag `phs.mode=degraded_inputs`.
