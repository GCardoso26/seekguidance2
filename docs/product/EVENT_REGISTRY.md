# Event Registry — JudgeTCG

**Version:** 1.0.0  
**Status:** Active (Beta 1.5 Event Integrity)  
**Runtime source of truth:** `services/api/app/judge/event_registry.py`  
**Owner:** Platform / Product Analytics

Every product analytics event **must** exist here and in the Python registry.  
No loose / unregistered emitters in production.

---

## Envelope (all events)

| Field | Required | Notes |
|-------|----------|-------|
| `event` | yes | Registry name |
| `timestamp` | yes | ISO-8601 UTC |
| `event_schema_version` | yes (default 1) | See EVENT_VERSIONING |
| `anonymous_id` | recommended | Pre-auth |
| `user_id` | optional | Authed |
| `tier` | optional | free\|pro\|team |
| `game_slug` | optional | |
| `idempotency_key` | critical events | See EVENT_IDEMPOTENCY |
| `source` | optional | client\|server |
| `properties` | object | Event-specific |

Canonical schema id: `{name}.v{N}` e.g. `search.v1`, `wishlist_created.v1`, `purchase.v1`.

---

## Registry entries

Legend: **Crit** = p0/p1/p2 · **Dep** = deprecated · **Src** = client/server · **Dst** = analytics_events

### Monetization / Checkout SaaS

| id | nome | cat | ver | owner | crit | retention | fonte | destino | dep | replacement | required props | optional props |
|----|------|-----|-----|-------|------|-----------|-------|---------|-----|-------------|----------------|----------------|
| evt.pricing_page_view | pricing_page_view | mono | 1 | growth | p0 | 400d | client | analytics_events | no | — | — | source, path |
| evt.pricing_toggle | pricing_toggle | mono | 1 | growth | p1 | 400d | client | analytics_events | no | — | isAnnual | — |
| evt.pricing_cta_click | pricing_cta_click | mono | 1 | growth | p0 | 400d | client | analytics_events | no | — | plan? | feature, isAnnual |
| evt.pricing_start_free | pricing_start_free | mono | 1 | growth | p1 | 400d | client | analytics_events | no | — | — | — |
| evt.paywall_hit | paywall_hit | mono | 1 | growth | p0 | 400d | client | analytics_events | no | — | feature | — |
| evt.upgrade_modal_open | upgrade_modal_open | mono | 1 | growth | p0 | 400d | client | analytics_events | no | — | feature | — |
| evt.upgrade_modal_close | upgrade_modal_close | mono | 1 | growth | p2 | 400d | client | analytics_events | no | — | — | — |
| evt.checkout_started | checkout_started | checkout | 1 | product | p0 | 400d | client/server | analytics_events | no | — | — | context, source, goal, session_id |
| evt.checkout_completed | checkout_completed | checkout | 1 | growth | p0 | 400d | client/server | analytics_events | no | — | — | session_id |
| evt.checkout_failed | checkout_failed | checkout | 1 | growth | p0 | 400d | client/server | analytics_events | no | — | — | reason |
| evt.subscription_cancelled | subscription_cancelled | mono | 1 | growth | p1 | 400d | server | analytics_events | no | — | — | — |
| evt.subscription_renewed | subscription_renewed | mono | 1 | growth | p1 | 400d | server | analytics_events | no | — | — | — |

### Marketplace / Buyer / Search

| id | nome | cat | ver | owner | crit | retention | fonte | destino | dep | replacement | required props | optional props |
|----|------|-----|-----|-------|------|-----------|-------|---------|-----|-------------|----------------|----------------|
| evt.page_view | page_view | buyer | 1 | product | p0 | 180d | client | analytics_events | no | — | path (via props) | url, referrer |
| evt.card_view | card_view | buyer | 1 | marketplace | p0 | 400d | client | analytics_events | no | — | card_id? | card_name, game |
| evt.search | search | search | 1 | search | p0 | 400d | client | analytics_events | no | — | — | query, filters, result_count, latency_ms, zero_results, search_id |
| evt.add_to_cart | add_to_cart | buyer | 1 | marketplace | p0 | 400d | client | analytics_events | no | — | — | product_id, card_id, source |
| evt.purchase | purchase | checkout | 1 | marketplace | p0 | 730d | client | analytics_events | no | — | — | order_id, session_id, value |
| evt.listing_create | listing_create | seller | 1 | seller | p0 | 400d | client | analytics_events | no | — | — | listing fields |
| evt.card_buy_click | card_buy_click | buyer | 1 | marketplace | p0 | 400d | client | analytics_events | no | — | card_id, listing_id | — |
| evt.card_add_to_cart | card_add_to_cart | buyer | 1 | marketplace | p0 | 400d | client | analytics_events | no | cart_item_added (future) | card_id, listing_id | — |
| evt.card_dwell_ms | card_dwell_ms | buyer | 1 | marketplace | p1 | 180d | client | analytics_events | no | — | — | dwell_ms, card_id |
| evt.announce_card_click | announce_card_click | seller | 1 | seller | p2 | 180d | client | analytics_events | no | — | card_id | — |

### Wishlist / Deck / Collection / UX

| id | nome | cat | ver | owner | crit | retention | dep | notes |
|----|------|-----|-----|-------|------|-----------|-----|-------|
| evt.wishlist_add | wishlist_add | wish | 1 | buyer | p1 | 400d | no | typed backlog |
| evt.wishlist_remove | wishlist_remove | wish | 1 | buyer | p2 | 400d | no | |
| evt.wishlist_created | wishlist_created | wish | 1 | buyer | p0 | 400d | no | name |
| evt.wishlist_shared | wishlist_shared | wish | 1 | buyer | p0 | 400d | no | list_id; idempotent |
| evt.wishlist_converted | wishlist_converted | wish | 1 | buyer | p0 | 400d | no | product_id, action |
| evt.deck_shop_open | deck_shop_open | deck | 1 | deck | p0 | 400d | no | deck_id, mode |
| evt.collection_import | collection_import | coll | 1 | product | p1 | 400d | no | ok, fail, source |
| evt.gallery_mode | gallery_mode | perf_ux | 1 | frontend | p2 | 90d | no | |
| evt.image_failure | image_failure | perf_ux | 1 | frontend | p1 | 90d | no | |
| evt.image_retry | image_retry | perf_ux | 1 | frontend | p2 | 90d | no | |
| evt.recommendation_click | recommendation_click | buyer | 1 | buyer | p1 | 400d | no | |
| evt.buyer_insight_click | buyer_insight_click | buyer | 1 | buyer | p2 | 400d | no | |
| evt.smart_cart_goal | smart_cart_goal | buyer | 1 | buyer | p1 | 400d | no | |
| evt.smart_cart_used | smart_cart_used | buyer | 1 | buyer | p1 | 400d | no | backlog |
| evt.cart_abandon_hint | cart_abandon_hint | buyer | 1 | buyer | p1 | 180d | no | backlog |
| evt.shipping_quote | shipping_quote | checkout | 1 | buyer | p1 | 180d | no | backlog |
| evt.freight_selected | freight_selected | checkout | 1 | buyer | p1 | 180d | no | backlog |
| evt.buyer_ai_used | buyer_ai_used | buyer | 1 | buyer | p1 | 400d | no | backlog |
| evt.search_converted | search_converted | search | 1 | search | p1 | 400d | no | backlog |
| evt.time_to_purchase_ms | time_to_purchase_ms | buyer | 1 | product | p1 | 400d | no | backlog |

### Judge / Engagement

| id | nome | cat | ver | owner | crit | dep | replacement |
|----|------|-----|-----|-------|------|-----|-------------|
| evt.report_resolved | report_resolved | judge | 1 | judge | p0 | no | — |
| evt.ruling_applied | ruling_applied | judge | 1 | judge | p0 | no | — |
| evt.report_created | report_created | judge | 1 | judge | p1 | no | — |
| evt.deck_validated | deck_validated | judge | 1 | judge | p1 | no | — |
| evt.tournament_create_started | tournament_create_started | eng | 1 | judge | p1 | no | — |
| evt.tournament_created | tournament_created | eng | 1 | judge | p1 | no | — |
| evt.search_used | search_used | search | 1 | search | p2 | **yes** | `search` |
| evt.question_asked … history_opened | (see registry.py) | eng | 1 | judge | p2 | no | backlog |

Full machine-readable list: `EVENT_REGISTRY` in `event_registry.py`.

---

## Change control

1. Add to `event_registry.py`  
2. Add FE `AnalyticsEventName` if client-emitted  
3. Document schema in EVENT_VERSIONING  
4. Update EVENT_PARITY matrix  
5. CI test `test_registry_covers_frontend_surface` must pass  
6. No production emit before steps 1–4
