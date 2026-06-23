"""API pública de vendedores (perfil, listagens, avaliações)."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace import card_listings as card_listings_svc
from app.marketplace import shop_reviews as shop_reviews_svc
from app.players.store import get_profile_by_handle


async def _resolve_seller_id(session: AsyncSession, seller_ref: str) -> str:
    """Aceita UUID do player ou handle."""
    ref = seller_ref.strip()
    if len(ref) >= 32 and "-" in ref:
        row = (
            await session.execute(
                text("SELECT id FROM tcg_judge.player_profiles WHERE id = :id"),
                {"id": ref},
            )
        ).mappings().first()
        if row:
            return str(row["id"])
    profile = await get_profile_by_handle(session, ref)
    if profile:
        return str(profile["id"])
    raise HTTPException(404, "Vendedor não encontrado")


async def get_seller_profile(session: AsyncSession, seller_ref: str) -> dict[str, Any]:
    seller_id = await _resolve_seller_id(session, seller_ref)
    profile = (
        await session.execute(
            text(
                """
                SELECT pp.id, pp.handle, pp.display_name, pp.avatar_url, pp.bio,
                       pp.city, pp.country, pp.created_at,
                       s.id AS store_id, s.name AS shop_name, s.slug AS store_slug,
                       s.logo_url AS banner_url, s.average_rating, s.review_count
                FROM tcg_judge.player_profiles pp
                LEFT JOIN tcg_judge.stores s ON s.owner_id = pp.id
                WHERE pp.id = :sid
                ORDER BY s.created_at ASC NULLS LAST
                LIMIT 1
                """
            ),
            {"sid": seller_id},
        )
    ).mappings().first()
    if not profile:
        raise HTTPException(404, "Vendedor não encontrado")

    stats = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) FILTER (
                    WHERE status IN ('paid','processing','shipped','delivered')
                ) AS total_sales,
                COALESCE(SUM(total_cents) FILTER (
                    WHERE status IN ('paid','processing','shipped','delivered')
                ), 0) AS total_revenue
                FROM tcg_judge.shop_orders o
                JOIN tcg_judge.stores st ON st.id = o.store_id
                WHERE st.owner_id = :sid
                """
            ),
            {"sid": seller_id},
        )
    ).mappings().first()

    listing_count = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) AS cnt FROM tcg_judge.card_listings
                WHERE seller_id = :sid AND status = 'active'
                """
            ),
            {"sid": seller_id},
        )
    ).scalar()

    p = dict(profile)
    rating_avg = float(p.get("average_rating") or 0)
    rating_count = int(p.get("review_count") or 0)
    return {
        "id": str(p["id"]),
        "user_id": str(p["id"]),
        "handle": p.get("handle"),
        "shop_name": p.get("shop_name") or p.get("display_name") or p.get("handle"),
        "avatar_url": p.get("avatar_url"),
        "banner_url": p.get("banner_url"),
        "bio": p.get("bio") or "",
        "location": ", ".join(filter(None, [p.get("city"), p.get("country")])),
        "store_id": str(p["store_id"]) if p.get("store_id") else None,
        "store_slug": p.get("store_slug"),
        "total_sales": int(stats["total_sales"] or 0) if stats else 0,
        "total_revenue_cents": int(stats["total_revenue"] or 0) if stats else 0,
        "rating_average": rating_avg,
        "rating_count": rating_count,
        "positive_rate": min(100.0, rating_avg / 5 * 100) if rating_count else 0,
        "active_listings": int(listing_count or 0),
        "member_since": p["created_at"].isoformat() if p.get("created_at") else None,
        "is_verified": False,
    }


async def get_seller_listings(
    session: AsyncSession,
    seller_ref: str,
    *,
    game_slug: str | None = None,
    condition: str | None = None,
    sort_by: str = "recent",
    page: int = 1,
    limit: int = 24,
) -> dict[str, Any]:
    seller_id = await _resolve_seller_id(session, seller_ref)
    limit = max(1, min(limit, 48))
    page = max(1, page)
    offset = (page - 1) * limit

    all_listings = await card_listings_svc.list_my_listings(session, seller_id, status="active")
    filtered = all_listings
    if game_slug:
        g = game_slug.upper()
        filtered = [listing for listing in filtered if str(listing.get("gameCode", "")).upper() == g]
    if condition:
        filtered = [
            listing
            for listing in filtered
            if str(listing.get("condition", "")).upper() == condition.upper()
        ]

    if sort_by == "price_asc":
        filtered.sort(key=lambda x: int(x.get("priceCents") or 0))
    elif sort_by == "price_desc":
        filtered.sort(key=lambda x: int(x.get("priceCents") or 0), reverse=True)

    total = len(filtered)
    page_items = filtered[offset : offset + limit]
    return {"listings": page_items, "total": total, "page": page, "limit": limit}


async def get_seller_reviews(
    session: AsyncSession,
    seller_ref: str,
    *,
    rating: int | None = None,
    page: int = 1,
    limit: int = 10,
) -> dict[str, Any]:
    seller_id = await _resolve_seller_id(session, seller_ref)
    store = (
        await session.execute(
            text("SELECT id FROM tcg_judge.stores WHERE owner_id = :oid LIMIT 1"),
            {"oid": seller_id},
        )
    ).mappings().first()
    if not store:
        return {"reviews": [], "total": 0, "page": page, "limit": limit}

    return await shop_reviews_svc.list_store_reviews(
        session,
        str(store["id"]),
        page=page,
        limit=limit,
        rating=rating,
    )


async def get_seller_review_summary(session: AsyncSession, seller_ref: str) -> dict[str, Any]:
    seller_id = await _resolve_seller_id(session, seller_ref)
    store = (
        await session.execute(
            text("SELECT id FROM tcg_judge.stores WHERE owner_id = :oid LIMIT 1"),
            {"oid": seller_id},
        )
    ).mappings().first()
    if not store:
        return {"total": 0, "average": 0, "distribution": {}, "positive_rate": 0}

    stats = await shop_reviews_svc.get_store_review_stats(session, str(store["id"]))
    dist = stats.get("distribution") or {}
    total = int(stats.get("total_reviews") or 0)
    positive = int(dist.get(5, 0)) + int(dist.get(4, 0))
    return {
        "total": total,
        "average": float(stats.get("average_rating") or 0),
        "distribution": {str(k): v for k, v in dist.items()},
        "positive_rate": round(positive / total * 100, 1) if total else 0,
    }


async def get_seller_stats(
    session: AsyncSession,
    seller_ref: str,
    *,
    period: str = "30d",
) -> dict[str, Any]:
    seller_id = await _resolve_seller_id(session, seller_ref)
    days = {"7d": 7, "30d": 30, "90d": 90, "all": 3650}.get(period, 30)

    row = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) AS sales_count,
                       COALESCE(SUM(o.total_cents), 0) AS revenue_cents,
                       COUNT(DISTINCT o.buyer_id) AS unique_buyers
                FROM tcg_judge.shop_orders o
                JOIN tcg_judge.stores s ON s.id = o.store_id
                WHERE s.owner_id = :sid
                  AND o.status IN ('paid','processing','shipped','delivered')
                  AND o.created_at >= NOW() - CAST(:days || ' days' AS interval)
                """
            ),
            {"sid": seller_id, "days": days},
        )
    ).mappings().first()

    sales_count = int(row["sales_count"] or 0) if row else 0
    revenue = int(row["revenue_cents"] or 0) if row else 0
    buyers = int(row["unique_buyers"] or 0) if row else 0

    return {
        "period": period,
        "sales_count": sales_count,
        "revenue_cents": revenue,
        "unique_buyers": buyers,
        "average_order_value_cents": revenue // sales_count if sales_count else 0,
        "top_selling_cards": [],
        "sales_by_game": [],
    }
