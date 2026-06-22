"""Agregações do painel do vendedor (loja + listagens)."""

from __future__ import annotations

from typing import Any, Literal

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace import card_listings as card_listings_svc
from app.marketplace import shop_orders

Period = Literal["7d", "30d", "90d", "1y", "all"]

_PERIOD_INTERVAL = {
    "7d": "7 days",
    "30d": "30 days",
    "90d": "90 days",
    "1y": "365 days",
    "all": None,
}


async def resolve_owner_store(session: AsyncSession, owner_id: str) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                SELECT id, slug, name, owner_id
                FROM tcg_judge.stores
                WHERE owner_id = :oid
                ORDER BY created_at ASC
                LIMIT 1
                """
            ),
            {"oid": owner_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Loja não encontrada")
    return dict(row)


async def get_dashboard(session: AsyncSession, owner_id: str) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])
    base = await shop_orders.store_dashboard_enhanced(session, store_id, owner_id)

    pending = (
        await session.execute(
            text(
                """
                SELECT
                  COUNT(*) FILTER (WHERE status = 'paid') AS pending_shipments,
                  COUNT(*) FILTER (WHERE status = 'disputed') AS open_disputes
                FROM tcg_judge.shop_orders
                WHERE store_id = :sid
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    low_stock = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) AS cnt
                FROM tcg_judge.store_products
                WHERE store_id = :sid AND is_active AND stock <= 3
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    listings_count = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) AS cnt
                FROM tcg_judge.card_listings
                WHERE seller_id = :uid AND status = 'active'
                """
            ),
            {"uid": owner_id},
        )
    ).mappings().first()

    recent = await shop_orders.list_store_orders(session, store_id, owner_id, limit=5)

    stats = base.get("stats") or {}
    revenue = base.get("revenue") or {}
    return {
        "store": base.get("store"),
        "kpis": {
            "revenue": {
                "current": int(revenue.get("month_cents") or 0),
                "previous": 0,
            },
            "sales_count": int(stats.get("paid_orders") or 0),
            "active_listings": int(listings_count["cnt"] if listings_count else 0)
            + int(stats.get("active_products") or 0),
        },
        "sales_chart": base.get("sales_chart") or [],
        "recent_orders": recent.get("orders") or [],
        "pending": {
            "shipments": int(pending["pending_shipments"] if pending else 0),
            "disputes": int(pending["open_disputes"] if pending else 0),
            "low_stock": int(low_stock["cnt"] if low_stock else 0),
        },
        "top_products": base.get("top_products") or [],
    }


async def get_store_order(session: AsyncSession, order_id: str, owner_id: str) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                SELECT o.*,
                  (SELECT json_agg(i.*) FROM tcg_judge.shop_order_items i WHERE i.order_id = o.id) AS items,
                  s.name AS store_name
                FROM tcg_judge.shop_orders o
                JOIN tcg_judge.stores s ON s.id = o.store_id
                WHERE o.id = :id AND s.owner_id = :oid
                """
            ),
            {"id": order_id, "oid": owner_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Pedido não encontrado")
    return dict(row)


async def get_seller_stats(session: AsyncSession, owner_id: str, period: Period = "30d") -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])
    interval = _PERIOD_INTERVAL.get(period)
    time_filter = "TRUE" if not interval else f"o.created_at >= NOW() - INTERVAL '{interval}'"

    summary = (
        await session.execute(
            text(
                f"""
                SELECT
                  COALESCE(SUM(o.store_receives_cents) FILTER (WHERE o.status = 'paid'), 0) AS revenue_cents,
                  COUNT(*) FILTER (WHERE o.status = 'paid') AS sales_count,
                  COUNT(DISTINCT o.buyer_id) FILTER (WHERE o.status = 'paid') AS unique_buyers
                FROM tcg_judge.shop_orders o
                WHERE o.store_id = :sid AND {time_filter}
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    chart = (
        await session.execute(
            text(
                f"""
                SELECT DATE(o.created_at) AS date,
                  COALESCE(SUM(o.store_receives_cents) FILTER (WHERE o.status = 'paid'), 0) AS revenue_cents,
                  COUNT(*) FILTER (WHERE o.status = 'paid') AS count
                FROM tcg_judge.shop_orders o
                WHERE o.store_id = :sid AND {time_filter}
                GROUP BY DATE(o.created_at)
                ORDER BY date
                """
            ),
            {"sid": store_id},
        )
    ).mappings().all()

    top_cards = (
        await session.execute(
            text(
                f"""
                SELECT i.product_name AS name,
                  SUM(i.quantity) AS count,
                  SUM(i.unit_price_cents * i.quantity) AS revenue_cents
                FROM tcg_judge.shop_order_items i
                JOIN tcg_judge.shop_orders o ON o.id = i.order_id
                WHERE o.store_id = :sid AND o.status = 'paid' AND {time_filter}
                GROUP BY i.product_name
                ORDER BY count DESC
                LIMIT 10
                """
            ),
            {"sid": store_id},
        )
    ).mappings().all()

    sales_count = int(summary["sales_count"] if summary else 0)
    revenue_cents = int(summary["revenue_cents"] if summary else 0)
    aov = round(revenue_cents / sales_count / 100, 2) if sales_count else 0

    return {
        "revenue": {
            "total_cents": revenue_cents,
            "chart": [dict(r) for r in chart],
        },
        "sales_count": sales_count,
        "unique_buyers": int(summary["unique_buyers"] if summary else 0),
        "top_cards": [dict(r) for r in top_cards],
        "sales_by_game": [],
        "average_order_value": aov,
    }


async def get_seller_settings(session: AsyncSession, owner_id: str) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    base = await shop_orders.store_dashboard_stats(session, str(store["id"]), owner_id)
    return base


async def update_seller_settings(
    session: AsyncSession,
    owner_id: str,
    *,
    name: str | None = None,
    description: str | None = None,
) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])
    sets: list[str] = []
    params: dict[str, Any] = {"id": store_id, "oid": owner_id}
    if name is not None:
        sets.append("name = :name")
        params["name"] = name
    if description is not None:
        sets.append("description = :description")
        params["description"] = description
    if not sets:
        return {"store": store}

    row = (
        await session.execute(
            text(
                f"""
                UPDATE tcg_judge.stores
                SET {", ".join(sets)}, updated_at = NOW()
                WHERE id = :id AND owner_id = :oid
                RETURNING *
                """
            ),
            params,
        )
    ).mappings().first()
    await session.commit()
    return {"store": dict(row) if row else store}


async def list_seller_listings(
    session: AsyncSession,
    owner_id: str,
    *,
    status: str | None = None,
    page: int = 1,
    limit: int = 24,
) -> dict[str, Any]:
    listings = await card_listings_svc.list_my_listings(session, owner_id, status=status)
    start = (max(1, page) - 1) * limit
    end = start + limit
    sliced = listings[start:end]
    return {"listings": sliced, "total": len(listings), "page": page, "limit": limit}
