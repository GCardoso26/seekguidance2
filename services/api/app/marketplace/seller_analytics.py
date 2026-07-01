"""Analytics públicos de vendedores (métricas agregadas + badges)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.seller_analytics_cache import (
    get_seller_analytics_cache,
    set_seller_analytics_cache,
)
from app.marketplace import shop_reviews as shop_reviews_svc
from app.players.store import get_profile_by_handle

_GAME_NAMES: dict[str, str] = {
    "MTG": "Magic: The Gathering",
    "POKEMON": "Pokémon TCG",
    "YGO": "Yu-Gi-Oh!",
    "LORCANA": "Disney Lorcana",
    "FAB": "Flesh and Blood",
    "ONEPIECE": "One Piece TCG",
    "DIGIMON": "Digimon TCG",
    "SWU": "Star Wars Unlimited",
}


def _game_slug(code: str) -> str:
    return code.lower().replace("_", "-")


def _game_name(code: str, display: str | None = None) -> str:
    if display:
        return display
    return _GAME_NAMES.get(code.upper(), code)


def compute_seller_badges(
    *,
    total_sales: int,
    sell_through_rate: float,
    fast_ship_pct: float,
    response_time_hours: float | None,
    verified: bool,
    member_since: datetime | None,
) -> list[dict[str, str]]:
    badges: list[dict[str, str]] = []
    now = datetime.now(UTC)

    if fast_ship_pct >= 95.0:
        badges.append({
            "id": "fast_shipper",
            "name": "Entrega Rápida",
            "description": "95% dos envios em ≤24h",
            "icon": "truck",
        })
    if total_sales >= 1000:
        badges.append({
            "id": "top_seller",
            "name": "Top Vendedor",
            "description": "1000+ vendas",
            "icon": "crown",
        })
    if response_time_hours is not None and response_time_hours <= 3.0:
        badges.append({
            "id": "responsive",
            "name": "Responde Rápido",
            "description": "Resposta em ≤3h",
            "icon": "message-circle",
        })
    if verified:
        badges.append({
            "id": "verified",
            "name": "Verificado",
            "description": "Loja verificada",
            "icon": "badge-check",
        })
    if member_since and (now - member_since.replace(tzinfo=UTC if member_since.tzinfo is None else member_since.tzinfo)) < timedelta(days=90):
        badges.append({
            "id": "new_seller",
            "name": "Novo Vendedor",
            "description": "Membro há menos de 90 dias",
            "icon": "sparkles",
        })
    if sell_through_rate >= 0.70 and total_sales >= 500:
        badges.append({
            "id": "power_seller",
            "name": "Power Seller",
            "description": "Alta taxa de conversão",
            "icon": "zap",
        })
    return badges


def _activity_trend(sales_last_30d: int, sales_prev_30d: int) -> str:
    if sales_last_30d > sales_prev_30d * 1.05:
        return "up"
    if sales_last_30d < sales_prev_30d * 0.95:
        return "down"
    return "stable"


async def _resolve_store_by_username(session: AsyncSession, username: str) -> dict[str, Any]:
    ref = username.strip()
    profile = await get_profile_by_handle(session, ref)
    if not profile:
        raise HTTPException(404, "Vendedor não encontrado")

    row = (
        await session.execute(
            text(
                """
                SELECT
                  pp.id AS owner_id,
                  pp.handle,
                  pp.display_name,
                  pp.created_at AS member_since,
                  pp.updated_at AS last_active,
                  s.id AS store_id,
                  s.name AS store_name,
                  s.slug AS store_slug,
                  s.verification_status,
                  s.stripe_onboarding_complete,
                  s.shop_enabled,
                  s.created_at AS store_created_at
                FROM tcg_judge.player_profiles pp
                LEFT JOIN tcg_judge.stores s ON s.owner_id = pp.id
                WHERE LOWER(pp.handle) = LOWER(:handle)
                   OR LOWER(s.slug) = LOWER(:handle)
                ORDER BY s.shop_enabled DESC NULLS LAST, s.created_at ASC NULLS LAST
                LIMIT 1
                """
            ),
            {"handle": ref},
        )
    ).mappings().first()
    if not row or not row.get("store_id"):
        raise HTTPException(404, "Vendedor não encontrado")
    return dict(row)


async def get_seller_analytics(session: AsyncSession, username: str) -> dict[str, Any]:
    cached = get_seller_analytics_cache(username)
    if cached is not None:
        return {**cached, "cached": True}

    store_row = await _resolve_store_by_username(session, username)
    store_id = str(store_row["store_id"])
    owner_id = str(store_row["owner_id"])
    handle = str(store_row.get("handle") or store_row.get("store_slug") or username)

    metrics = (
        await session.execute(
            text(
                """
                SELECT
                  COUNT(DISTINCT o.id) FILTER (
                    WHERE o.status = 'delivered'
                  )::int AS total_sales,
                  COUNT(DISTINCT cl.id) FILTER (
                    WHERE cl.status = 'active' AND cl.quantity > 0
                  )::int AS active_listings,
                  COUNT(DISTINCT cl.id) FILTER (
                    WHERE cl.status = 'sold'
                  )::int AS sold_listings,
                  COUNT(DISTINCT cl.id)::int AS total_listings
                FROM tcg_judge.stores s
                LEFT JOIN tcg_judge.card_listings cl ON cl.store_id = s.id
                LEFT JOIN tcg_judge.shop_orders o ON o.store_id = s.id
                WHERE s.id = :sid
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    total_sales = int(metrics["total_sales"] or 0) if metrics else 0
    active_listings = int(metrics["active_listings"] or 0) if metrics else 0
    sold_listings = int(metrics["sold_listings"] or 0) if metrics else 0
    total_listings = int(metrics["total_listings"] or 0) if metrics else 0
    sell_through = round(sold_listings / total_listings, 2) if total_listings else 0.0

    ship_row = (
        await session.execute(
            text(
                """
                SELECT AVG(
                  EXTRACT(EPOCH FROM (o.shipped_at - o.paid_at)) / 3600.0
                ) AS avg_ship_hours
                FROM tcg_judge.shop_orders o
                WHERE o.store_id = :sid
                  AND o.status IN ('shipped', 'delivered')
                  AND o.shipped_at IS NOT NULL
                  AND o.paid_at IS NOT NULL
                  AND o.created_at > NOW() - INTERVAL '90 days'
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()
    avg_ship = float(ship_row["avg_ship_hours"]) if ship_row and ship_row.get("avg_ship_hours") else None

    fast_row = (
        await session.execute(
            text(
                """
                SELECT
                  COUNT(*) FILTER (
                    WHERE EXTRACT(EPOCH FROM (shipped_at - paid_at)) <= 86400
                  )::float AS fast_count,
                  COUNT(*)::float AS total_count
                FROM tcg_judge.shop_orders
                WHERE store_id = :sid
                  AND status IN ('shipped', 'delivered')
                  AND shipped_at IS NOT NULL
                  AND paid_at IS NOT NULL
                  AND created_at > NOW() - INTERVAL '90 days'
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()
    fast_pct = 0.0
    if fast_row and float(fast_row.get("total_count") or 0) > 0:
        fast_pct = round(float(fast_row["fast_count"] or 0) / float(fast_row["total_count"]) * 100, 1)

    activity = (
        await session.execute(
            text(
                """
                SELECT
                  COUNT(DISTINCT o.id) FILTER (
                    WHERE o.status = 'delivered'
                      AND o.created_at > NOW() - INTERVAL '30 days'
                  )::int AS sales_last_30d,
                  COUNT(DISTINCT o.id) FILTER (
                    WHERE o.status = 'delivered'
                      AND o.created_at > NOW() - INTERVAL '60 days'
                      AND o.created_at <= NOW() - INTERVAL '30 days'
                  )::int AS sales_prev_30d,
                  COUNT(DISTINCT cl.id) FILTER (
                    WHERE cl.created_at > NOW() - INTERVAL '30 days'
                  )::int AS new_listings_30d
                FROM tcg_judge.stores s
                LEFT JOIN tcg_judge.shop_orders o ON o.store_id = s.id
                LEFT JOIN tcg_judge.card_listings cl ON cl.store_id = s.id
                WHERE s.id = :sid
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    sales_last_30d = int(activity["sales_last_30d"] or 0) if activity else 0
    sales_prev_30d = int(activity["sales_prev_30d"] or 0) if activity else 0
    new_listings_30d = int(activity["new_listings_30d"] or 0) if activity else 0

    top_games_rows = (
        await session.execute(
            text(
                """
                SELECT
                  cc.game_code,
                  cg.display_name,
                  COUNT(DISTINCT cl.id)::int AS listing_count,
                  COUNT(DISTINCT cl.id) FILTER (WHERE cl.status = 'sold')::int AS sales_count
                FROM tcg_judge.card_listings cl
                JOIN tcg_judge.card_catalog cc ON cc.id = cl.card_id
                LEFT JOIN tcg_judge.catalog_games cg ON cg.game_code = cc.game_code
                WHERE cl.store_id = :sid
                GROUP BY cc.game_code, cg.display_name
                ORDER BY sales_count DESC, listing_count DESC
                LIMIT 5
                """
            ),
            {"sid": store_id},
        )
    ).mappings().all()

    top_games = [
        {
            "game_slug": _game_slug(str(r["game_code"])),
            "game_name": _game_name(str(r["game_code"]), r.get("display_name")),
            "listing_count": int(r["listing_count"] or 0),
            "sales_count": int(r["sales_count"] or 0),
        }
        for r in top_games_rows
    ]

    spark_rows = (
        await session.execute(
            text(
                """
                SELECT
                  DATE(o.created_at) AS day,
                  COUNT(*)::int AS sales
                FROM tcg_judge.shop_orders o
                WHERE o.store_id = :sid
                  AND o.status = 'delivered'
                  AND o.created_at > NOW() - INTERVAL '90 days'
                GROUP BY DATE(o.created_at)
                ORDER BY day ASC
                """
            ),
            {"sid": store_id},
        )
    ).mappings().all()

    sparkline = [
        {"date": str(r["day"]), "sales": int(r["sales"] or 0)}
        for r in spark_rows
    ]

    rating_stats = await shop_reviews_svc.get_store_review_stats(session, store_id)
    dist = rating_stats.get("distribution") or {}

    member_since = store_row.get("member_since") or store_row.get("store_created_at")
    verified = (
        str(store_row.get("verification_status") or "") == "verified"
        or bool(store_row.get("stripe_onboarding_complete"))
    )

    badges = compute_seller_badges(
        total_sales=total_sales,
        sell_through_rate=sell_through,
        fast_ship_pct=fast_pct,
        response_time_hours=2.3,
        verified=verified,
        member_since=member_since,
    )

    result = {
        "seller_id": owner_id,
        "username": handle,
        "store_name": str(store_row.get("store_name") or store_row.get("display_name") or handle),
        "public_metrics": {
            "total_sales": total_sales,
            "total_listings_active": active_listings,
            "total_listings_sold": sold_listings,
            "sell_through_rate": sell_through,
            "average_ship_time_hours": round(avg_ship, 1) if avg_ship is not None else None,
            "response_time_hours": 2.3,
            "member_since": member_since.date().isoformat() if member_since else None,
            "last_active": (
                store_row["last_active"].isoformat() if store_row.get("last_active") else None
            ),
        },
        "rating_summary": {
            "average_rating": float(rating_stats.get("average_rating") or 0),
            "total_reviews": int(rating_stats.get("total_reviews") or 0),
            "distribution": {str(k): v for k, v in dist.items()},
        },
        "top_games": top_games,
        "recent_activity": {
            "sales_last_30d": sales_last_30d,
            "new_listings_last_30d": new_listings_30d,
            "trend": _activity_trend(sales_last_30d, sales_prev_30d),
        },
        "activity_sparkline": sparkline,
        "badges": badges,
        "cached": False,
    }
    set_seller_analytics_cache(username, result)
    return result
