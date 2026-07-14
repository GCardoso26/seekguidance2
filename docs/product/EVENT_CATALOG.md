# Event Catalog — JudgeTCG

**Version:** 1.1.0  
**Status:** Active  
**Owner:** Product Analytics  
**Companion:** [EVENT_TAXONOMY.md](./EVENT_TAXONOMY.md) · [EVENT_REGISTRY.md](./EVENT_REGISTRY.md) · [EVENT_PARITY.md](./EVENT_PARITY.md)

**Beta 1.5:** Wishlist / deck_shop / former orphans are **persisted** (no longer FIRED_DROPPED). Status keys updated below where relevant.

Single catalog of product analytics events grouped by persona / domain.  
**P** = Priority for Beta instrumentation (P0 must persist; P1 asap; P2 later).

Status keys: ● LIVE · ○ FIRED_DROPPED · ◌ TYPED_DEAD · ★ PROPOSED

---

## Buyer

| Event | Status | P | Funnel step | Notes |
|-------|--------|---|-------------|-------|
| `page_view` | ● | P0 | Landing / navigate | Path-based; coverage incomplete |
| `search` | ● | P0 | Search | Rename candidate → `SearchPerformed` |
| `SearchResultClicked` | ★ | P0 | Search | **Missing** — needed for CTR |
| `card_view` | ● | P0 | Card | Noisy on tiles; split impression |
| `card_dwell_ms` | ○ | P1 | Card | Persist + allowlist |
| `OfferViewed` | ★ | P0 | Offer | Listing/offer detail view |
| `card_buy_click` | ○ | P0 | Offer → Cart | Persist |
| `card_add_to_cart` / `add_to_cart` | ○/● | P0 | Cart | Unify |
| `CartOpened` | ★ | P0 | Cart | Missing |
| `checkout_started` | ● | P0 | Checkout | Disambiguate SaaS vs marketplace |
| `PaymentCompleted` | ★ | P0 | Payment | Prefer domain event + mirror analytics |
| `purchase` | ● | P0 | Order | Add idempotency |
| `wishlist_created` | ● | P0 | Wishlist | Persisted (1.5) |
| `wishlist_shared` | ● | P0 | Wishlist | Persisted (1.5) |
| `WishlistVisited` | ★ | P0 | Wishlist | Shared-link open |
| `wishlist_converted` | ● | P0 | Wishlist | Persisted (1.5) |
| `wishlist_add` | ◌ | P1 | Wishlist | Wire or remove |
| `wishlist_remove` | ○ | P2 | Wishlist | Persist optional |
| `recommendation_click` | ○ | P1 | Discovery | Persist |
| `buyer_insight_click` | ○ | P2 | Discovery | Persist |
| `smart_cart_goal` | ○ | P1 | Cart | Persist |
| `time_to_purchase_ms` | ◌ | P1 | KPI | Compute server-side preferred |
| `shipping_quote` / `freight_selected` | ◌ | P1 | Checkout | Wire |

Canonical aliases (docs): `SearchPerformed`, `SearchResultClicked`, `CardViewed`, `OfferViewed`, `CartOpened`, `CheckoutStarted`, `PaymentCompleted`, `OrderCompleted`, `WishlistCreated`, `WishlistShared`, `WishlistVisited`, `WishlistConverted`.

---

## Search

| Event | Status | P | Notes |
|-------|--------|---|-------|
| `search` | ● | P0 | Record query, filters, result_count, latency_ms, zero_results |
| `search_used` | ◌ | — | Duplicate; deprecate |
| `search_converted` | ◌ | P1 | Attribution Search→Purchase |
| `SearchFilterApplied` | ★ | P1 | Facet usage |
| `SearchZeroResults` | ★ | P0 | Explicit flag or derived |
| `SearchSuggestionClicked` | ★ | P2 | Autocomplete |

Required payload for `search` (target):

```json
{
  "query": "string",
  "game": "string|null",
  "filters": {},
  "result_count": 0,
  "zero_results": false,
  "latency_ms": 0,
  "search_id": "uuid"
}
```

---

## Seller

| Event | Status | P | Notes |
|-------|--------|---|-------|
| `SellerSignupStarted` | ★ | P0 | Funnel |
| `SellerSignupCompleted` | ★ | P0 | |
| `SellerKycStarted` / `SellerKycCompleted` / `SellerKycFailed` | ★ | P0 | KYC |
| `listing_create` | ● | P0 | First listing proxy |
| `InventoryViewed` | ★ | P1 | Seller inventory page |
| `InventoryUpdated` | ★ | P1 | Qty change |
| `PriceChanged` | ★ | P1 | Price edit |
| `OfferCreated` | ★ | P0 | Alias of listing create |
| `OfferSold` | ★ | P0 | From order domain event |
| `announce_card_click` | ○ | P2 | Persist or merge |

---

## Admin / Trust

| Event | Status | P | Notes |
|-------|--------|---|-------|
| `ModerationCaseOpened` | ★ | P1 | |
| `ModerationCaseResolved` | ★ | P1 | |
| `DisputeOpened` / `DisputeResolved` | ★ | P1 | |
| `EscrowHeld` / `EscrowReleased` | ★ | P1 | Mirror finance domain |

---

## Monetization (SaaS)

| Event | Status | P |
|-------|--------|---|
| `pricing_page_view` | ● | P0 |
| `pricing_toggle` | ● | P1 |
| `pricing_cta_click` | ● | P0 |
| `pricing_start_free` | ● | P1 |
| `paywall_hit` | ● | P0 |
| `upgrade_modal_open` | ● | P0 |
| `upgrade_modal_close` | ◌ | P2 |
| `checkout_started` (sub) | ● | P0 |
| `checkout_completed` | ● | P0 |
| `checkout_failed` | ◌ | P0 wire |
| `subscription_cancelled` / `subscription_renewed` | ◌ | P1 |

---

## Judge / Assistant

| Event | Status | P |
|-------|--------|---|
| `report_created` | ◌ | P1 |
| `report_resolved` | ● | P0 |
| `ruling_applied` | ● | P0 |
| `deck_validated` | ◌ | P1 |
| Engagement ask/share/feedback | ◌ | P2 |

---

## Deck Builder

| Event | Status | P |
|-------|--------|---|
| `DeckCreated` | ★ | P0 |
| `DeckSaved` | ★ | P0 |
| `DeckShared` | ★ | P1 |
| `deck_shop_open` | ○ | P0 persist |
| `DeckCardsPurchased` | ★ | P0 | Attribution |

---

## Collection

| Event | Status | P |
|-------|--------|---|
| `collection_import` | ○ | P1 persist |

---

## Performance UX

| Event | Status | P |
|-------|--------|---|
| `gallery_mode` | ○ | P2 |
| `image_failure` | ○ | P1 |
| `image_retry` | ◌ | P2 |

---

## Analytics / Health / Errors (system)

Not product UI events; sourced from OTel / monitoring / Lighthouse CI.

| Signal | Source | P |
|--------|--------|---|
| API availability / error rate | Monitoring | P0 |
| P95 latency key routes | Performance | P0 |
| Web Vitals (LCP/INP/CLS) | RUM (proposed) | P1 |
| Pipeline lag / drop rate | Analytics DQ | P0 |
| Synthetic smoke | Release smoke | P0 |

---

## Catalog completeness score (Beta day-0)

| Domain | Instrument coverage (persistable) | Verdict |
|--------|-----------------------------------|---------|
| Buyer core funnel | Partial (holes at click/offer/cart open) | **Incomplete** |
| Search quality | Basic `search` only | **Incomplete** |
| Wishlist | Emit without persist | **Broken** |
| Seller lifecycle | Only `listing_create` | **Incomplete** |
| Deck shop | Emit without persist | **Broken** |
| Admin trust | None product analytics | **Missing** |
| Monetization | Strong | **Good** |

**Catalog rule for Public Beta:** no new product feature ships without a catalog row marked P0 with Origin + Destination + Owner.
