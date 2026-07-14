# Analytics Health Score (AHS)

**Version:** 1.0.0  
**Status:** Active  
**Owner:** Platform  
**Range:** 0–100  
**Distinct from:** Product Health Score (product outcomes)

---

## Purpose

Measure **trust in analytics infrastructure**, not marketplace conversion.

---

## Formula

\[
\mathrm{AHS} = 100 \times \sum w_i n_i
\]

| Component | Weight | Normalization \(n\) |
|-----------|--------|---------------------|
| Emit→Persist ratio | 0.25 | \(n_p = \mathrm{clamp}(persisted / \max(emitted,1), 0, 1)\) *(approx: persisted / (persisted+dead+lost) for received batches)* |
| Rejection integrity | 0.15 | \(n_r = 1\) if all rejects in DLQ; else \(1 - lost/received\) |
| DLQ pressure | 0.10 | \(n_d = \mathrm{clamp}(1 - pending_{dlq}/threshold, 0, 1)\), threshold=500 |
| Schema validity | 0.15 | fraction of persisted with supported schema_version |
| Duplication | 0.10 | \(n_{dup} = \mathrm{clamp}(1 - dup\_rate/0.05, 0, 1)\) |
| Ingest latency | 0.10 | \(n_l = 1\) if P95 lag < 15m else degrade to 0 at 60m |
| Availability | 0.15 | track endpoint success (ok processing) ≥ SLO |

Approx day-0 batch score from API response:

\[
n_{integrity} = 1 - \frac{lost}{received}, \quad
n_{useful} = \frac{persisted}{received}
\]

Wire via `GET /runtime/judge/analytics/ingestion-health`.

---

## Bands

| AHS | Band | Action |
|-----|------|--------|
| ≥ 90 | Trusted | Normal product metrics use |
| 75–89 | Watch | Investigate DLQ reasons |
| 50–74 | Degraded | Freeze dashboard decisions |
| < 50 | Untrusted | Do not steer Beta on event KPIs; use domain orders only |

---

## Relation to Product Health

Product Health assumes AHS ≥ 75. If AHS lower, PHS reports `phs.mode=degraded_inputs`.
