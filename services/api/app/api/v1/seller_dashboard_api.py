"""Painel do vendedor — rotas consolidadas sobre shop/listings existentes."""

from __future__ import annotations

from typing import Any, Literal

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.marketplace import card_listings as card_listings_svc
from app.marketplace import seller_dashboard as seller_dash
from app.marketplace import shop_orders
from fastapi import APIRouter, Header
from pydantic import BaseModel, Field

router = APIRouter(tags=["seller-dashboard"])


class ShippingBody(BaseModel):
    tracking_code: str = Field(min_length=1, max_length=120)
    carrier: str | None = None


class SellerSettingsBody(BaseModel):
    name: str | None = None
    description: str | None = None


class ListingUpdateBody(BaseModel):
    price: float | None = None
    quantity: int | None = None
    status: str | None = None
    description: str | None = None


@router.get("/runtime/judge/seller/dashboard")
async def seller_dashboard_get(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_dash.get_dashboard(session, user_id)


@router.get("/runtime/judge/seller/listings")
async def seller_listings_list(
    session: DbSession,
    status: str | None = None,
    page: int = 1,
    limit: int = 24,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_dash.list_seller_listings(
        session, user_id, status=status, page=page, limit=limit
    )


@router.patch("/runtime/judge/seller/listings/{listing_id}")
async def seller_listing_patch(
    session: DbSession,
    listing_id: str,
    body: ListingUpdateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    fields: dict[str, Any] = {}
    if body.price is not None:
        fields["price_cents"] = int(round(body.price * 100))
    if body.quantity is not None:
        fields["quantity"] = body.quantity
    if body.status is not None:
        fields["status"] = body.status
    if body.description is not None:
        fields["description"] = body.description
    listing = await card_listings_svc.update_listing(session, listing_id, user_id, fields)
    return {"listing": listing}


@router.delete("/runtime/judge/seller/listings/{listing_id}")
async def seller_listing_delete(
    session: DbSession,
    listing_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    await card_listings_svc.delete_listing(session, listing_id, user_id)
    return {"ok": True}


@router.get("/runtime/judge/seller/orders")
async def seller_orders_list(
    session: DbSession,
    status: str | None = None,
    period: str | None = None,
    page: int = 1,
    limit: int = 20,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    store = await seller_dash.resolve_owner_store(session, user_id)
    return await shop_orders.list_store_orders(
        session,
        str(store["id"]),
        user_id,
        status=status,
        page=page,
        limit=limit,
    )


@router.get("/runtime/judge/seller/orders/{order_id}")
async def seller_order_detail(
    session: DbSession,
    order_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    order = await seller_dash.get_store_order(session, order_id, user_id)
    return {"order": order}


@router.post("/runtime/judge/seller/orders/{order_id}/ship")
async def seller_order_ship(
    session: DbSession,
    order_id: str,
    body: ShippingBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    order = await shop_orders.update_order_status(
        session, order_id, user_id, "shipped", tracking_code=body.tracking_code
    )
    return {"order": order}


@router.get("/runtime/judge/seller/stats")
async def seller_stats_get(
    session: DbSession,
    period: Literal["7d", "30d", "90d", "1y", "all"] = "30d",
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_dash.get_seller_stats(session, user_id, period=period)


@router.get("/runtime/judge/seller/settings")
async def seller_settings_get(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_dash.get_seller_settings(session, user_id)


@router.put("/runtime/judge/seller/settings")
async def seller_settings_put(
    session: DbSession,
    body: SellerSettingsBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await seller_dash.update_seller_settings(
        session, user_id, name=body.name, description=body.description
    )
