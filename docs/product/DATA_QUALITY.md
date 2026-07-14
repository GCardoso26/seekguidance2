# Data Quality — Product Analytics

**Version:** 1.1.0  
**Status:** Active  
**Owner:** Platform + Product Analytics  
**Beta 1.5:** Silent allowlist drop **eliminated** (unknown → DLQ; BuyerExperience + orphans registered).

---

## 1. Scope

Audit of product analytics **payloads, typing, duplication, orphans, missing data, timestamps, timezone, idempotency**.

---

## 2. Findings

### 2.1 Allowlist divergence — RESOLVED (Beta 1.5)

| Surface | Behavior |
|---------|----------|
| FE `AnalyticsEventName` | Includes BuyerExperience + former orphans |
| BE `EVENT_REGISTRY` / `ALL_ANALYTICS_EVENTS` | **Parity** with FE surface |
| Unknown names | **DLQ** `unknown_event` — never silent discard |

**DQ metric:** `lost / received` must be ~0; monitor `dead_lettered` by reason.

### 2.2 Orphan emitters — RESOLVED (Beta 1.5)

Former orphans (`announce_card_click`, `card_dwell_ms`, `card_buy_click`, `card_add_to_cart`) are in FE union + BE registry.

### 2.3 Dead typed events

Many Monetization/Engagement/Judge/Buyer names never referenced by FE callers (see EVENT_TAXONOMY). Risk: false confidence in “coverage”.

### 2.4 Semantic duplication

| Cluster | Conflict |
|---------|----------|
| `search` vs `search_used` | Two names, one intent |
| `add_to_cart` vs `card_add_to_cart` | Split cart instrumentation |
| `purchase` vs `checkout_completed` | Marketplace vs SaaS (not documented in payload) |
| `checkout_started` dual domain | Ambiguous funnels |
| `card_view` tile+detail | Inflates views |

### 2.5 Payload inconsistency

| Issue | Evidence |
|-------|----------|
| Free-form `properties` | `Record<string, unknown>` — no schema registry |
| ID fields | `product_id` vs `card_id` vs `listing_id` mixed |
| Search payload | Not guaranteed `result_count` / `latency_ms` |
| `event_schema_version` | **Emitted (v1)**; strict JSON Schema per event TBD |
| `tier` default `"free"` | May mislabel authed pro users if not passed |

### 2.6 Timestamps & timezone

- Client emits ISO UTC via `toISOString()` — good.
- No `client_tz` / `utc_offset` — session local-day KPIs harder.
- BE parses ISO; fallback `now(UTC)` on bad input — **clock skew hiding**.

### 2.7 Idempotency — IMPROVED (Beta 1.5)

- SDK derives `idempotency_key` for critical events.
- DB unique index `(event, idempotency_key)` after migration.
- Duplicates counted (not double-inserted); queue clear gated on body.ok.

### 2.8 Identity

- `anonymous_id` localStorage + `session_id` sessionStorage — good basics.
- No documented merge of anon→user on login (identity stitching gap).
- `user_id` only when passed by caller / useAnalytics.

### 2.9 Transport — IMPROVED (Beta 1.5)

- Soft HTTP 200 retained for browser/LH.
- Body carries `ok`, `persisted`, `dead_lettered`, `lost`, `ingest_trace_id`.
- Client clears queue only when integrity accounted (`lost==0`).

### 2.10 Volume & noise

- Auto `page_view` + frequent `card_view` may dominate storage.
- Retention policy not enforced in app (documented default only).

---

## 3. Data quality checks

| Check | Severity | Rule | Status |
|-------|----------|------|--------|
| Unknown event name | P0 | → DLQ; alert on rate | Implemented path |
| FE⊆BE registry | P0 | pytest contract | Implemented |
| Idempotency duplicates | P0 | unique index | Migration |
| Schema version missing | P1 | default v1 | Implemented |
| Required props / JSON Schema | P1 | DLQ invalid_payload | Partial (type checks) |
| Spike WoW volume | P2 | Anomaly | Future |

---

## 4. Remediation backlog (remaining)

1. ~~Align allowlist~~ done  
2. ~~Dead-letter table~~ done (apply migration)  
3. Strict JSON Schema catalog per P0 event  
4. Disambiguate checkout `properties.context`  
5. Ensure purchase pages pass `order_id`/`session_id` seeds  
6. ~~CI registry parity~~ done (`test_event_integrity.py`)  
7. Stitch anon→user  

---

## 5. DQ Score (simple)

\[
\text{DQ} = 100 \times (1 - d_{lost}) \times (1 - d_{dup}) \times c_{schema}
\]

Where \(d_{lost}=lost/received\), \(d_{dup}\) duplicate ratio, \(c_{schema}\) fraction with schema_version.  
Post–1.5 estimate (after migration + deploy): **DQ ≈ 75–85** (semantic duplicates / free-form props remain).