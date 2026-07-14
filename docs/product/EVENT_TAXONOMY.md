# Event Taxonomy — JudgeTCG Product Analytics

**Version:** 1.1.0  
**Status:** Active (Public Beta + Event Integrity 1.5)  
**Owner:** Product Analytics  
**Retention default:** 400 days (raw events); 25 months (aggregated KPIs)  
**Schema version field:** `event_schema_version` (**emitted**; default v1)  
**Runtime registry:** `services/api/app/judge/event_registry.py` · [EVENT_REGISTRY.md](./EVENT_REGISTRY.md)

---

## 1. Naming Convention (Canonical)

| Rule | Standard | Current state |
|------|----------|---------------|
| Case | `snake_case` | Mostly compliant |
| Verb | past tense / noun_action | Mixed (`search` vs `search_used`) |
| Prefix | domain optional | Incomplete |
| Version | suffix `_vN` or payload field | **Absent** |
| Locale | English event names | Compliant |

**Proposed canonical form:** `{domain}_{object}_{action}`  
Examples: `marketplace_card_viewed`, `search_query_performed`, `wishlist_list_shared`

During Public Beta we **document aliases**; migration is additive only (dual-write later).

---

## 2. Categories

| Category | Code | Description |
|----------|------|-------------|
| Acquisition | `acq` | Landing, pricing, signup entry |
| Buyer Journey | `buyer` | Browse → cart → purchase |
| Search | `search` | Query, facets, zero-results |
| Wishlist | `wish` | Lists, share, convert |
| Seller | `seller` | Listings, inventory, sales |
| Checkout / Payments | `checkout` | Checkout + payment outcomes |
| Monetization (SaaS) | `mono` | Paywall, plans, subscription |
| Judge / Assistant | `judge` | Reports, rulings, deck validate |
| Engagement | `eng` | Ask, share, favorites |
| Deck Builder | `deck` | Create, save, shop |
| Collection | `coll` | Import / collection ops |
| Performance UX | `perf_ux` | Image fail, dwell, gallery |
| Health / System | `health` | Synthetic / ops (not product UI) |
| Analytics Meta | `meta` | DQ, schema, pipeline |

---

## 3. Audit Summary (as of RC1 / Public Beta)

### 3.1 Sources of truth today

| Layer | Path | Role |
|-------|------|------|
| FE type union | `frontend/runtime_console_v3/src/lib/analytics.ts` | Allowed client names |
| FE emitter | `trackEvent` / `useAnalytics` | Queue → `/api/analytics/track` |
| FE proxy | `app/api/analytics/track/route.ts` | Soft-200, forward upstream |
| BE allowlist | `services/api/app/judge/analytics_events.py` `ALL_ANALYTICS_EVENTS` | **Hard filter** before INSERT |
| Storage | `tcg_judge.analytics_events` | Postgres best-effort |

### 3.2 Gaps — Beta 1.5 status

1. ~~BuyerExperience not in BE allowlist~~ → **FIXED** (registry parity + persist).
2. ~~Orphan emitters~~ → **REGISTERED** (`announce_card_click`, `card_dwell_ms`, `card_buy_click`, `card_add_to_cart`).
3. **Duplicate semantic names** remain (documented; dual-write later): `search`/`search_used`, cart variants, checkout SaaS vs marketplace.
4. ~~No schema version~~ → **FIXED** (`event_schema_version=1`).
5. **`page_view` coverage** still depends on `useAnalytics` mount.
6. **Idempotency** → **SDK keys + unique index** (migration); seeds required for strong dedupe.
7. **Timezone:** UTC OK; no `client_tz` yet.
8. ~~Tournament dropped~~ → **FIXED**.
9. Unknown events → **DLQ** (not lost).

---

## 4. Event Inventory (Taxonomy Cards)

Legend: **Status** = `LIVE` (fired + typically persisted) | `FIRED_DROPPED` | `TYPED_DEAD` | `PROPOSED`

Retention column: days raw unless noted.

### 4.1 Acquisition / Monetization

| Name | Description | Payload (observed / proposed) | Origin | Destination | Owner | Ver | Ret | Cat | Status |
|------|-------------|-------------------------------|--------|-------------|-------|-----|-----|-----|--------|
| `pricing_page_view` | User opened pricing | `source?`, `path` | `/pricing` | analytics_events | Growth | 1 | 400 | mono | LIVE |
| `pricing_toggle` | Annual/monthly toggle | `isAnnual` | Pricing UI | analytics_events | Growth | 1 | 400 | mono | LIVE |
| `pricing_cta_click` | CTA to plan | `plan`, `isAnnual`, `feature?` | Pricing / UpgradeModal | analytics_events | Growth | 1 | 400 | mono | LIVE |
| `pricing_start_free` | Start free CTA | — | Pricing | analytics_events | Growth | 1 | 400 | mono | LIVE |
| `paywall_hit` | Feature gated | `feature` | FeatureGate | analytics_events | Growth | 1 | 400 | mono | LIVE |
| `upgrade_modal_open` | Upgrade modal shown | `feature` | UpgradeModal | analytics_events | Growth | 1 | 400 | mono | LIVE |
| `upgrade_modal_close` | Modal closed | — | — | analytics_events | Growth | 1 | 400 | mono | TYPED_DEAD |
| `checkout_started` | Checkout begin (SaaS or cart) | `source?`, `goal?`, subscription props | Checkout / cart / sub | analytics_events | Product | 1 | 400 | checkout | LIVE *(ambiguous)* |
| `checkout_completed` | Payment success page (SaaS) | `session_id` | `/payment/success` | analytics_events | Growth | 1 | 400 | checkout | LIVE |
| `checkout_failed` | Checkout error | — | — | analytics_events | Growth | 1 | 400 | checkout | TYPED_DEAD |
| `subscription_cancelled` | Sub cancel | — | — | analytics_events | Growth | 1 | 400 | mono | TYPED_DEAD |
| `subscription_renewed` | Sub renew | — | — | analytics_events | Growth | 1 | 400 | mono | TYPED_DEAD |

### 4.2 Marketplace / Buyer core

| Name | Description | Payload | Origin | Destination | Owner | Ver | Ret | Cat | Status |
|------|-------------|---------|--------|-------------|-------|-----|-----|-----|--------|
| `page_view` | Route change | `path`, `url`, `referrer`, `session_id` | useAnalytics | analytics_events | Product | 1 | 180 | buyer | LIVE* |
| `card_view` | Card seen (detail or card tile) | `card_id`, `card_name?`, `game?` | CardDetail / CardCard | analytics_events | Marketplace | 1 | 400 | buyer | LIVE *(noisy)* |
| `search` | Faceted search executed | query facets (varies) | FacetedSearch | analytics_events | Search | 1 | 400 | search | LIVE |
| `add_to_cart` | Item added to cart | `product_id?`, `card_id?`, `source?` | useShopCart / Wishlist | analytics_events | Marketplace | 1 | 400 | buyer | LIVE |
| `purchase` | Order success (marketplace) | order props | checkout/success | analytics_events | Marketplace | 1 | 730 | checkout | LIVE |
| `listing_create` | Seller created listing | listing fields | CreateListingForm | analytics_events | Seller | 1 | 400 | seller | LIVE |

### 4.3 Buyer Experience (FE typed — BE drop)

| Name | Description | Payload | Origin | Destination | Owner | Ver | Ret | Cat | Status |
|------|-------------|---------|--------|-------------|-------|-----|-----|-----|--------|
| `wishlist_add` | Item added to wishlist | — | — | *dropped* | Buyer | 1 | 400 | wish | TYPED_DEAD |
| `wishlist_remove` | Item removed | `product_id` | WishlistPage | *dropped* | Buyer | 1 | 400 | wish | FIRED_DROPPED |
| `wishlist_created` | List created | `name` | useWishlistLists | *dropped* | Buyer | 1 | 400 | wish | FIRED_DROPPED |
| `wishlist_shared` | List shared | `list_id` | useWishlistLists | *dropped* | Buyer | 1 | 400 | wish | FIRED_DROPPED |
| `wishlist_converted` | Wishlist → cart | `product_id`, `action` | WishlistPage | *dropped* | Buyer | 1 | 400 | wish | FIRED_DROPPED |
| `shipping_quote` | Freight quote | — | — | *dropped* | Buyer | 1 | 180 | checkout | TYPED_DEAD |
| `freight_selected` | Freight chosen | — | — | *dropped* | Buyer | 1 | 180 | checkout | TYPED_DEAD |
| `gallery_mode` | Virtualized gallery | `virtualized`, `count` | CardGrid | *dropped* | Frontend | 1 | 90 | perf_ux | FIRED_DROPPED |
| `image_retry` | Image retry | — | — | *dropped* | Frontend | 1 | 90 | perf_ux | TYPED_DEAD |
| `image_failure` | Image fail / missing alt | `url_host`, `reason` | CardImage | *dropped* | Frontend | 1 | 90 | perf_ux | FIRED_DROPPED |
| `buyer_ai_used` | Buyer AI feature | — | — | *dropped* | Buyer | 1 | 400 | buyer | TYPED_DEAD |
| `search_converted` | Search → purchase attribution | — | — | *dropped* | Search | 1 | 400 | search | TYPED_DEAD |
| `smart_cart_used` | Smart cart used | — | — | *dropped* | Buyer | 1 | 400 | buyer | TYPED_DEAD |
| `cart_abandon_hint` | Abandonment hint shown | — | — | *dropped* | Buyer | 1 | 180 | buyer | TYPED_DEAD |
| `recommendation_click` | Reco clicked | props | BuyerDashboard | *dropped* | Buyer | 1 | 400 | buyer | FIRED_DROPPED |
| `buyer_insight_click` | Insight clicked | props | BuyerDashboard | *dropped* | Buyer | 1 | 400 | buyer | FIRED_DROPPED |
| `smart_cart_goal` | Smart cart goal | `goal` | cart page | *dropped* | Buyer | 1 | 400 | buyer | FIRED_DROPPED |
| `deck_shop_open` | Deck → shop panel | `deck_id`, `mode`, `added` | DeckShoppingPanel | *dropped* | Deck | 1 | 400 | deck | FIRED_DROPPED |
| `collection_import` | CSV import result | `ok`, `fail`, `source` | CollectionImportCsv | *dropped* | Coll | 1 | 400 | coll | FIRED_DROPPED |
| `time_to_purchase_ms` | Timed purchase metric | — | — | *dropped* | Product | 1 | 400 | buyer | TYPED_DEAD |

### 4.4 Fired outside official union (orphan emitters)

| Name | Description | Payload | Origin | Destination | Owner | Ver | Ret | Cat | Status |
|------|-------------|---------|--------|-------------|-------|-----|-----|-----|--------|
| `announce_card_click` | CTA announce | `card_id` | AnnounceCardCta | *dropped* | Seller | 1 | 180 | seller | FIRED_DROPPED |
| `card_dwell_ms` | Time on card detail | dwell props | CardDetailPage | *dropped* | Marketplace | 1 | 180 | buyer | FIRED_DROPPED |
| `card_buy_click` | Buy click on listing | `card_id`, `listing_id` | CardDetailPage | *dropped* | Marketplace | 1 | 400 | buyer | FIRED_DROPPED |
| `card_add_to_cart` | Add from card detail | `card_id`, `listing_id` | CardDetailPage | *dropped* | Marketplace | 1 | 400 | buyer | FIRED_DROPPED |

### 4.5 Engagement / Judge (typed; partial fire / BE gaps)

| Name | Status notes |
|------|----------------|
| `question_asked`, `verdict_shared`, `source_clicked`, `feedback_given`, `favorite_saved`, `game_changed`, `search_used`, `history_opened` | TYPED_DEAD (no FE callers found in audit) |
| `tournament_create_started`, `tournament_created` | FIRED on FE; **not** in BE ENGAGEMENT allowlist → FIRED_DROPPED |
| `report_created`, `deck_validated` | TYPED_DEAD |
| `report_resolved`, `ruling_applied` | LIVE (judge portal) if in BE allowlist — yes |

---

## 5. Proposed Canonical Aliases (additive future)

| Current | Canonical (v2) | Notes |
|---------|----------------|-------|
| `search` | `search_performed` | Align with catalog |
| `search_used` | deprecate | Duplicate semantics |
| `card_view` | `card_viewed` | Past tense |
| `card_view` (tile) | `card_impressed` | Split impression vs detail |
| `add_to_cart` / `card_add_to_cart` | `cart_item_added` | Single event |
| `purchase` / `checkout_completed` | `order_completed` vs `subscription_checkout_completed` | Disambiguate |
| `checkout_started` | `cart_checkout_started` / `subscription_checkout_started` | Context |

---

## 6. Standard Envelope (target)

```json
{
  "event": "search_performed",
  "event_schema_version": 1,
  "timestamp": "2026-07-14T14:00:00.000Z",
  "anonymous_id": "uuid",
  "user_id": "uuid|null",
  "session_id": "uuid",
  "tier": "free|pro|team",
  "game_slug": "mtg|null",
  "properties": {},
  "idempotency_key": "optional-uuid"
}
```

---

## 7. Ownership Matrix

| Domain | Owner | Steward |
|--------|-------|---------|
| Marketplace buyer funnel | Product Analytics | Marketplace Eng |
| Search | Product Analytics | Search Eng |
| Seller | Product Analytics | Seller Eng |
| Monetization SaaS | Growth | Frontend |
| Judge | Product Analytics | Judge Eng |
| Pipeline / DQ | Platform | Platform Eng |

---

## 8. Change Control

- New events require entry in this taxonomy **before** FE emit.
- BE allowlist must match FE union (or accept unknown into dead-letter).
- No breaking rename without dual-write window ≥ 30 days.
- Public Beta: documentation + allowlist alignment prioritized over new product features.
