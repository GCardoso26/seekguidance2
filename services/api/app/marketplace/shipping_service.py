"""Shipping Application Service — Sprint 15.

Orquestra cotações, smart cart e read models. Frontend nunca acessa Melhor Envio.
"""

from __future__ import annotations

from typing import Any, Literal

from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace import shop_cart
from app.marketplace.freight_quote import quote_freight, shipping_v2_enabled
from app.marketplace.smart_cart import analyze_cart

ShippingGoal = Literal["lowest_price", "fastest", "best_value", "pickup"]


async def get_shipping_read_model(
    session: AsyncSession,
    user_id: str,
    *,
    destination_postal_code: str,
) -> dict[str, Any]:
    cart = await shop_cart.get_cart(session, user_id)
    raw = cart.get("items") or []
    items = list(raw) if isinstance(raw, list) else []
    freight = await quote_freight(
        session,
        user_id=user_id,
        destination_postal_code=destination_postal_code,
        cart_items=items,
    )
    smart = await analyze_cart(session, user_id, goal="best_value")
    summary = smart.get("summary") or {}
    # FE espera `quotes` como lista plana; `quote_freight` aninha em {quotes, recommended, meta}.
    quote_rows = freight.get("quotes") if isinstance(freight, dict) else None
    if not isinstance(quote_rows, list):
        quote_rows = []
    return {
        "shipping_v2": shipping_v2_enabled(),
        "destination_postal_code": destination_postal_code,
        "quotes": quote_rows,
        "recommended": freight.get("recommended") if isinstance(freight, dict) else None,
        "meta": freight.get("meta") if isinstance(freight, dict) else None,
        "cart_summary": summary,
        "by_store": smart.get("by_store") or [],
    }


async def analyze_smart_cart_with_shipping(
    session: AsyncSession,
    user_id: str,
    *,
    goal: str = "best_value",
    destination_postal_code: str | None = None,
) -> dict[str, Any]:
    smart = await analyze_cart(session, user_id, goal=goal)  # type: ignore[arg-type]
    if destination_postal_code and shipping_v2_enabled():
        cart = await shop_cart.get_cart(session, user_id)
        raw = cart.get("items") or []
        items = list(raw) if isinstance(raw, list) else []
        freight = await quote_freight(
            session,
            user_id=user_id,
            destination_postal_code=destination_postal_code,
            cart_items=items,
        )
        smart["shipping"] = freight
        rec = freight.get("recommended") or {}
        lowest = rec.get("lowest_price") or {}
        smart.setdefault("summary", {})
        smart["summary"]["shipping_cents_v2"] = int(lowest.get("price_cents") or 0)
        smart["summary"]["delivery_days_v2"] = int(lowest.get("delivery_days") or 0)
        smart["summary"]["shipping_source"] = (freight.get("meta") or {}).get("source")
    return smart
