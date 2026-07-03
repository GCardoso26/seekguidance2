"""Clientes enriquecidos do painel vendedor."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.seller_dashboard import resolve_owner_store


async def list_seller_customers(
    session: AsyncSession,
    owner_id: str,
    *,
    search: str | None = None,
    segment: str | None = None,
    page: int = 1,
    limit: int = 25,
) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])

    clauses = ["sc.store_id = :sid"]
    params: dict[str, Any] = {
        "sid": store_id,
        "lim": min(100, max(1, limit)),
        "off": (max(1, page) - 1) * limit,
    }
    if segment:
        clauses.append("sc.segment = :seg")
        params["seg"] = segment
    if search:
        term = search.strip()
        if term:
            params["pat"] = f"%{term}%"
            clauses.append(
                """(
                    sc.display_name ILIKE :pat
                    OR sc.email ILIKE :pat
                    OR sc.customer_id ILIKE :pat
                    OR COALESCE(pp.handle, '') ILIKE :pat
                )"""
            )

    where = " AND ".join(clauses)
    rows = (
        await session.execute(
            text(
                f"""
                SELECT sc.*,
                       pp.handle,
                       pp.city,
                       pp.avatar_url
                FROM tcg_judge.store_customers sc
                LEFT JOIN tcg_judge.player_profiles pp ON pp.id = sc.customer_id
                WHERE {where}
                ORDER BY sc.last_order_at DESC NULLS LAST
                LIMIT :lim OFFSET :off
                """
            ),
            params,
        )
    ).mappings().all()

    count_row = (
        await session.execute(
            text(
                f"""
                SELECT COUNT(*) AS total
                FROM tcg_judge.store_customers sc
                LEFT JOIN tcg_judge.player_profiles pp ON pp.id = sc.customer_id
                WHERE {where}
                """
            ),
            {k: v for k, v in params.items() if k not in {"lim", "off"}},
        )
    ).mappings().first()

    return {
        "customers": [dict(r) for r in rows],
        "total": int(count_row["total"]) if count_row else 0,
        "page": page,
        "limit": limit,
    }


async def get_customer_detail(
    session: AsyncSession,
    owner_id: str,
    customer_id: str,
) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])

    row = (
        await session.execute(
            text(
                """
                SELECT sc.*,
                       pp.handle,
                       pp.city,
                       pp.country,
                       pp.avatar_url,
                       pp.bio
                FROM tcg_judge.store_customers sc
                LEFT JOIN tcg_judge.player_profiles pp ON pp.id = sc.customer_id
                WHERE sc.store_id = :sid AND sc.customer_id = :cid
                """
            ),
            {"sid": store_id, "cid": customer_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Cliente não encontrado")
    return dict(row)


async def list_customer_orders(
    session: AsyncSession,
    owner_id: str,
    customer_id: str,
    *,
    limit: int = 20,
) -> list[dict[str, Any]]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])

    rows = (
        await session.execute(
            text(
                """
                SELECT o.*
                FROM tcg_judge.shop_orders o
                WHERE o.store_id = :sid AND o.buyer_id = :cid
                ORDER BY o.created_at DESC
                LIMIT :lim
                """
            ),
            {"sid": store_id, "cid": customer_id, "lim": min(limit, 50)},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def get_customer_gamification(
    session: AsyncSession,
    owner_id: str,
    customer_id: str,
) -> dict[str, Any]:
    await get_customer_detail(session, owner_id, customer_id)
    try:
        row = (
            await session.execute(
                text(
                    """
                    SELECT total_xp, level, league_tier
                    FROM tcg_judge.player_gamification
                    WHERE player_id = :pid
                    """
                ),
                {"pid": customer_id},
            )
        ).mappings().first()
        badges = (
            await session.execute(
                text(
                    """
                    SELECT b.code, b.name, b.icon_url, pb.earned_at
                    FROM tcg_judge.player_badges pb
                    JOIN tcg_judge.badges b ON b.id = pb.badge_id
                    WHERE pb.player_id = :pid
                    ORDER BY pb.earned_at DESC
                    LIMIT 20
                    """
                ),
                {"pid": customer_id},
            )
        ).mappings().all()
    except Exception:
        return {
            "gamification": {"total_xp": 0, "level": 1, "league_tier": None},
            "badges": [],
        }

    return {
        "gamification": dict(row) if row else {"total_xp": 0, "level": 1, "league_tier": None},
        "badges": [dict(b) for b in badges],
    }
