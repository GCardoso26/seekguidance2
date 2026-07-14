# Event Idempotency

**Version:** 1.0.0  
**Status:** Active  
**Owner:** Platform

---

## Critical events (must be idempotent)

| Event | Key strategy (v1) | Store |
|-------|-------------------|-------|
| `purchase` | `purchase:{order_id\|session_id}` | unique (event, idempotency_key) |
| `checkout_completed` | `checkout_completed:{session_id}` | same |
| `checkout_started` | `checkout_started:{session_id}` | same (1 per session default) |
| `checkout_failed` | `checkout_failed:{session_id}:{reason?}` | same |
| `listing_create` | `listing_create:{listing_id\|session}` | same |
| `wishlist_shared` | `wishlist_shared:{list_id}` | same |
| `wishlist_converted` | `wishlist_converted:{product_id}` | same |
| `add_to_cart` | `add_to_cart:{product_id\|card_id\|listing_id}` | same |
| `inventory_update` | **Not product-analytics yet** — domain ledger is SoT; when emitted, key `inventory_update:{sku}:{rev}` | planned |
| payment (domain) | Prefer payment webhook idempotency at payments BC; mirror analytics with `payment:{payment_intent_id}` | planned |

---

## Behavior

1. Client SDK derives key from properties seed or `event:session_id`.  
2. Server UNIQUE INDEX on `(event, idempotency_key)` WHERE key IS NOT NULL.  
3. Duplicate insert → count `duplicates`, **not** error, **not** DLQ.  
4. Events without key: best-effort (may duplicate on refresh) — critical paths should always set key.

---

## Replay

Replaying a DLQ item with the same idempotency_key is safe: second persist = duplicate.

---

## Immediate applicability

No new business APIs required. Uses existing track path + migration unique index. Apply migration before relying on DB-level dedupe; SDK keys already reduce refresh doubles for seeded ids.
