"""API Buyer Experience — Sprint 14."""

from __future__ import annotations

from typing import Any, Literal

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter(tags=["buyer-experience"])


class CartOptimizeBody(BaseModel):
    goal: Literal[
        "lowest_price",
        "fewest_stores",
        "highest_reputation",
        "best_value",
        "fastest_shipping",
    ] = "best_value"


class DeckShopBody(BaseModel):
    deck_id: str = Field(min_length=1)
    mode: Literal["all", "missing"] = "missing"


@router.get("/runtime/judge/buyer/dashboard")
async def buyer_dashboard(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace.buyer_dashboard import get_buyer_dashboard
    from app.marketplace.buyer_recommendations import get_buyer_recommendations

    user_id = _require_user(x_judge_user_id)
    dash = await get_buyer_dashboard(session, user_id)
    try:
        recs = await get_buyer_recommendations(session, user_id, limit=8)
        dash["recommended"] = recs.get("you_may_like") or []
        dash["recommendation_groups"] = recs
    except Exception:
        dash["recommended"] = []
    return dash


@router.get("/runtime/judge/buyer/recommendations")
async def buyer_recommendations(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
    limit: int = Query(default=12, ge=1, le=40),
) -> dict[str, Any]:
    from app.marketplace.buyer_recommendations import get_buyer_recommendations

    user_id = _require_user(x_judge_user_id)
    return await get_buyer_recommendations(session, user_id, limit=limit)


@router.get("/runtime/judge/buyer/ai/insights")
async def buyer_ai_insights(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace.buyer_ai import get_buyer_insights

    user_id = _require_user(x_judge_user_id)
    return await get_buyer_insights(session, user_id)


@router.get("/runtime/judge/marketplace/shop/cart/smart")
async def smart_cart_get(
    session: DbSession,
    goal: str = Query(default="best_value"),
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace.smart_cart import analyze_cart

    user_id = _require_user(x_judge_user_id)
    allowed = {
        "lowest_price",
        "fewest_stores",
        "highest_reputation",
        "best_value",
        "fastest_shipping",
    }
    if goal not in allowed:
        raise HTTPException(400, "goal inválido")
    return await analyze_cart(session, user_id, goal=goal)  # type: ignore[arg-type]


@router.post("/runtime/judge/marketplace/shop/cart/smart")
async def smart_cart_post(
    body: CartOptimizeBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace.smart_cart import analyze_cart

    user_id = _require_user(x_judge_user_id)
    return await analyze_cart(session, user_id, goal=body.goal)


@router.get("/runtime/judge/marketplace/shop/stores/slug/{slug}/reputation")
async def store_reputation_public(session: DbSession, slug: str) -> dict[str, Any]:
    from app.marketplace.store_reputation_public import get_store_reputation_public

    return await get_store_reputation_public(session, slug)


@router.get("/runtime/judge/buyer/decks/{deck_id}/shop")
async def deck_shopping_plan(
    deck_id: str,
    session: DbSession,
    mode: Literal["all", "missing"] = Query(default="missing"),
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace.deck_shopping import build_deck_shopping_plan

    user_id = _require_user(x_judge_user_id)
    return await build_deck_shopping_plan(session, user_id, deck_id, mode=mode)


# --- Sprint 15: Wishlist ---


class WishlistCreateBody(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class WishlistRenameBody(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class WishlistItemBody(BaseModel):
    product_id: str = Field(min_length=1)
    product: dict[str, Any] | None = None


class WishlistMoveBody(BaseModel):
    item_ids: list[str] = Field(min_length=1)
    target_list_id: str = Field(min_length=1)
    copy: bool = False


class WishlistMergeBody(BaseModel):
    source_id: str = Field(min_length=1)
    target_id: str = Field(min_length=1)


class WishlistReorderBody(BaseModel):
    item_ids: list[str] = Field(min_length=1)


@router.get("/runtime/judge/buyer/wishlists")
async def buyer_wishlists_list(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace import wishlist as wishlist_svc

    user_id = _require_user(x_judge_user_id)
    return await wishlist_svc.list_wishlists(session, user_id)


@router.post("/runtime/judge/buyer/wishlists")
async def buyer_wishlists_create(
    body: WishlistCreateBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace import wishlist as wishlist_svc

    user_id = _require_user(x_judge_user_id)
    return await wishlist_svc.create_wishlist(session, user_id, name=body.name)


@router.get("/runtime/judge/buyer/wishlists/{list_id}")
async def buyer_wishlist_detail(
    list_id: str,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace import wishlist as wishlist_svc

    user_id = _require_user(x_judge_user_id)
    return await wishlist_svc.get_wishlist(session, user_id, list_id)


@router.patch("/runtime/judge/buyer/wishlists/{list_id}")
async def buyer_wishlist_rename(
    list_id: str,
    body: WishlistRenameBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace import wishlist as wishlist_svc

    user_id = _require_user(x_judge_user_id)
    return await wishlist_svc.rename_wishlist(session, user_id, list_id, name=body.name)


@router.delete("/runtime/judge/buyer/wishlists/{list_id}")
async def buyer_wishlist_delete(
    list_id: str,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace import wishlist as wishlist_svc

    user_id = _require_user(x_judge_user_id)
    await wishlist_svc.delete_wishlist(session, user_id, list_id)
    return {"ok": True}


@router.post("/runtime/judge/buyer/wishlists/{list_id}/duplicate")
async def buyer_wishlist_duplicate(
    list_id: str,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace import wishlist as wishlist_svc

    user_id = _require_user(x_judge_user_id)
    return await wishlist_svc.duplicate_wishlist(session, user_id, list_id)


@router.post("/runtime/judge/buyer/wishlists/{list_id}/share")
async def buyer_wishlist_share(
    list_id: str,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace import wishlist as wishlist_svc

    user_id = _require_user(x_judge_user_id)
    return await wishlist_svc.share_wishlist(session, user_id, list_id)


@router.post("/runtime/judge/buyer/wishlists/{list_id}/items")
async def buyer_wishlist_add_item(
    list_id: str,
    body: WishlistItemBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace import wishlist as wishlist_svc

    user_id = _require_user(x_judge_user_id)
    return await wishlist_svc.add_item(
        session,
        user_id,
        list_id,
        product_id=body.product_id,
        product_snapshot=body.product,
    )


@router.delete("/runtime/judge/buyer/wishlists/{list_id}/items/{product_id}")
async def buyer_wishlist_remove_item(
    list_id: str,
    product_id: str,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace import wishlist as wishlist_svc

    user_id = _require_user(x_judge_user_id)
    await wishlist_svc.remove_item(session, user_id, list_id, product_id)
    return {"ok": True}


@router.post("/runtime/judge/buyer/wishlists/move")
async def buyer_wishlist_move_items(
    body: WishlistMoveBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace import wishlist as wishlist_svc

    user_id = _require_user(x_judge_user_id)
    return await wishlist_svc.move_items(
        session,
        user_id,
        item_ids=body.item_ids,
        target_list_id=body.target_list_id,
        copy=body.copy,
    )


@router.post("/runtime/judge/buyer/wishlists/merge")
async def buyer_wishlist_merge(
    body: WishlistMergeBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace import wishlist as wishlist_svc

    user_id = _require_user(x_judge_user_id)
    return await wishlist_svc.merge_lists(
        session, user_id, source_id=body.source_id, target_id=body.target_id
    )


@router.post("/runtime/judge/buyer/wishlists/{list_id}/reorder")
async def buyer_wishlist_reorder(
    list_id: str,
    body: WishlistReorderBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace import wishlist as wishlist_svc

    user_id = _require_user(x_judge_user_id)
    return await wishlist_svc.reorder_list_items(session, user_id, list_id, item_ids=body.item_ids)


# Legacy flat wishlist (BFF /api/wishlist)
@router.get("/runtime/judge/marketplace/wishlist")
async def marketplace_wishlist_flat_get(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace import wishlist as wishlist_svc

    user_id = _require_user(x_judge_user_id)
    return await wishlist_svc.get_flat_wishlist(session, user_id)


@router.post("/runtime/judge/marketplace/wishlist")
async def marketplace_wishlist_flat_add(
    body: WishlistItemBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace import wishlist as wishlist_svc

    user_id = _require_user(x_judge_user_id)
    return await wishlist_svc.add_flat_item(
        session, user_id, product_id=body.product_id, product=body.product
    )


@router.delete("/runtime/judge/marketplace/wishlist/{product_id}")
async def marketplace_wishlist_flat_remove(
    product_id: str,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace import wishlist as wishlist_svc

    user_id = _require_user(x_judge_user_id)
    await wishlist_svc.remove_flat_item(session, user_id, product_id)
    return {"ok": True}


# --- Sprint 15: Shipping ---


class ShippingQuoteBody(BaseModel):
    destination_postal_code: str = Field(min_length=8, max_length=12)


class SmartCartShippingBody(BaseModel):
    goal: Literal[
        "lowest_price",
        "fewest_stores",
        "highest_reputation",
        "best_value",
        "fastest_shipping",
    ] = "best_value"
    destination_postal_code: str | None = None


@router.get("/runtime/judge/buyer/shipping/quote")
async def buyer_shipping_quote(
    session: DbSession,
    destination_postal_code: str = Query(min_length=8, max_length=12),
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace.shipping_service import get_shipping_read_model

    user_id = _require_user(x_judge_user_id)
    return await get_shipping_read_model(
        session, user_id, destination_postal_code=destination_postal_code
    )


@router.post("/runtime/judge/marketplace/shop/cart/smart/shipping")
async def smart_cart_with_shipping(
    body: SmartCartShippingBody,
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace.shipping_service import analyze_smart_cart_with_shipping

    user_id = _require_user(x_judge_user_id)
    return await analyze_smart_cart_with_shipping(
        session,
        user_id,
        goal=body.goal,
        destination_postal_code=body.destination_postal_code,
    )


# --- Sprint 15: Buyer Analytics ---


@router.get("/runtime/judge/buyer/analytics")
async def buyer_analytics(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace.buyer_analytics import get_buyer_analytics

    user_id = _require_user(x_judge_user_id)
    return await get_buyer_analytics(session, user_id)


@router.get("/runtime/judge/buyer/cohorts")
async def buyer_cohorts(
    session: DbSession,
    period: Literal["daily", "weekly", "monthly", "quarterly"] = Query(default="weekly"),
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    from app.marketplace.buyer_cohorts import list_cohorts

    _require_user(x_judge_user_id)
    return await list_cohorts(session, period=period)
