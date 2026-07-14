# Product Funnels — JudgeTCG

**Version:** 1.0.0  
**Status:** Active  
**Owner:** Product Analytics  
**Related:** [EVENT_CATALOG.md](./EVENT_CATALOG.md) · [KPIS.md](./KPIS.md)

Funnels are **definitions**, not UI. Conversion = downstream step unique users (or sessions) ÷ upstream in window.

**Window default:** 7 days sessionized; order attribution 14 days.  
**Identity:** prefer `user_id`, else `anonymous_id` + `session_id`.

---

## 1. Marketplace Funnel (primary)

```text
Landing (page_view path ∈ /, /loja, /marketplace*)
        ↓
Search (search)
        ↓
Card (card_view detail OR CardViewed)
        ↓
Offer (OfferViewed / card_buy_click)
        ↓
Cart (add_to_cart | CartOpened)
        ↓
Checkout (checkout_started source=marketplace|smart_cart)
        ↓
Payment (PaymentCompleted ★ / purchase pending)
        ↓
Order (purchase | OrderCompleted)
```

| Step | Current event | Gap |
|------|---------------|-----|
| Landing | `page_view` | Incomplete mount coverage |
| Search | `search` | Need result_count / zero flag |
| Card | `card_view` | Tile vs detail conflated |
| Offer | `card_buy_click` ○ | Not persisted |
| Cart | `add_to_cart` ● / `card_add_to_cart` ○ | Split + drop |
| Checkout | `checkout_started` ● | Mixed with SaaS |
| Payment | — | Domain/payment webhook not mirrored |
| Order | `purchase` ● | Idempotency missing |

**Primary conversion KPI:** Search → Order (7d).  
**Secondary:** Landing → Order; Card → Cart; Cart → Order.

---

## 2. Wishlist Funnel

```text
WishlistCreated (wishlist_created ○)
        ↓
WishlistShared (wishlist_shared ○)
        ↓
WishlistVisited (★ missing)
        ↓
WishlistConverted (wishlist_converted ○ → cart)
        ↓
Order (purchase attributed source=wishlist)
```

| Gap | Impact |
|-----|--------|
| Events dropped by BE allowlist | Funnel invisible in DB |
| No visit event on shared link | Cannot measure share→visit |
| Attribution weak | Wishlist GMV unknown |

---

## 3. Seller Funnel

```text
Signup (SellerSignup* ★)
        ↓
KYC (SellerKyc* ★)
        ↓
First listing (listing_create ● — first ever)
        ↓
First sale (OfferSold ★ / order item)
        ↓
Recurrence (2nd+ sale in 30d)
```

| Gap | Impact |
|-----|--------|
| No signup/KYC analytics events | Onboarding dark |
| No OfferSold product event | Rely on order tables (OK if joined) |
| Recurrence needs order warehouse | SQL KPI, not only events |

**Liquidity bridge:** Active sellers with ≥1 live listing AND ≥1 sale / 30d.

---

## 4. Deck Builder Funnel

```text
DeckCreated (★)
        ↓
DeckSaved (★)
        ↓
DeckShared (★)
        ↓
deck_shop_open (○)
        ↓
Cart / Purchase of deck cards (DeckCardsPurchased ★)
```

Gaps: create/save/share not instrumented in product analytics; shop open dropped.

---

## 5. Monetization Funnel (SaaS)

```text
pricing_page_view
        ↓
pricing_cta_click | paywall_hit | upgrade_modal_open
        ↓
checkout_started (subscription)
        ↓
checkout_completed
```

Strongest instrumented funnel today. Keep separate from Marketplace checkout.

---

## 6. Search Quality Micro-Funnel

```text
search
        ↓
SearchResultClicked (★)
        ↓
card_view / OfferViewed
        ↓
add_to_cart
        ↓
purchase (search_converted ◌ / attribution)
```

Zero-results branch: `search` where `result_count=0` → exit (measure rate).

---

## 7. Funnel measurement rules

1. **Do not mix SaaS and marketplace** `checkout_*` without `properties.context`.
2. Prefer **session_id** for short funnels; **user_id** for retention.
3. **Step drop** = 1 − (step_n / step_n-1).
4. Alert when drop worsens >20% WoW for P0 steps (after baseline).
5. Until BE allowlist fixed, treat wishlist/deck funnels as **instrumentation backlog**, not “users abandoned”.

---

## 8. Funnel owners

| Funnel | Owner | Engineering steward |
|--------|-------|---------------------|
| Marketplace | Product Analytics | Marketplace + Frontend |
| Wishlist | Product Analytics | Buyer Platform |
| Seller | Product Analytics | Seller |
| Deck Builder | Product Analytics | Deck |
| Monetization | Growth | Frontend |
| Search quality | Product Analytics | Search |
