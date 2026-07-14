# Event Schema Versioning

**Version:** 1.0.0  
**Status:** Active  
**Owner:** Platform

---

## Rules

1. Every event payload carries `event_schema_version` (integer ≥ 1).  
2. Canonical schema id: `{event_name}.v{N}` (example: `search.v1`, `purchase.v1`, `wishlist_created.v1`).  
3. Supported versions at ingest: **`{1}`** (`SUPPORTED_SCHEMA_VERSIONS`).  
4. Missing version → **default v1** (backward compatible).  
5. Unsupported version → **DLQ** `invalid_schema_version` (not silent drop).  
6. Additive field changes stay on same version if optional.  
7. Breaking changes → new version; dual-accept old for ≥ 30 days.

---

## Envelope.v1

```json
{
  "event": "string",
  "timestamp": "ISO-8601",
  "event_schema_version": 1,
  "anonymous_id": "string?",
  "user_id": "string?",
  "tier": "free|pro|team",
  "game_slug": "string?",
  "idempotency_key": "string?",
  "source": "client|server",
  "properties": {}
}
```

---

## Named schemas (v1 highlights)

### `search.v1`
Optional (target contract): `query`, `game`, `filters`, `result_count`, `zero_results`, `latency_ms`, `search_id`.

### `wishlist_created.v1`
Optional: `name`.

### `wishlist_shared.v1`
Optional: `list_id`. Idempotent on `list_id`.

### `purchase.v1` / `purchase.completed.v1` (alias naming in docs)
Optional: `order_id`, `session_id`, `value`. Idempotent on `order_id|session_id`.

### `listing_create.v1` / `listing.created.v1`
Listing metadata in properties. Idempotent when `listing_id` present.

### `checkout_started.v1`
Optional: `context` (`marketplace`|`subscription`), `source`, `goal`.

Free-form properties remain tolerated in v1 for compatibility; **P0 events must converge** to documented fields. Strict JSON Schema enforcement is gated behind registry evolution (v1.1+), with failures → DLQ `invalid_payload`.

---

## Compatibility matrix

| Client | Server | Result |
|--------|--------|--------|
| no version | accepts as v1 | persist |
| v1 | v1 supported | persist |
| v2 | not supported yet | DLQ |
| v1 unknown event | — | DLQ unknown_event |
