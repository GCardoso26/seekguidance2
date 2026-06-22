"""Liga Pass — XP, níveis e leaderboard."""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.players.store import ensure_player_profile

XP_REWARDS: dict[str, int] = {
    "buy_card": 10,
    "sell_card": 15,
    "list_card": 5,
    "create_deck": 20,
    "publish_deck": 30,
    "post_community": 3,
    "comment": 2,
    "complete_profile": 50,
}

LEVEL_MINS: dict[str, int] = {
    "bronze": 0,
    "silver": 1000,
    "gold": 5000,
    "platinum": 15000,
    "judge": 30000,
}

NEXT_LEVEL_MINS: dict[str, int] = {
    "bronze": 1000,
    "silver": 5000,
    "gold": 15000,
    "platinum": 30000,
    "judge": 30000,
}

DEFAULT_BENEFITS: dict[str, Any] = {
    "name": "Bronze",
    "color_hex": "#CD7F32",
    "cashback_percent": 0,
    "free_shipping_threshold": None,
    "max_alerts": 10,
}


def _stat_increments(action_type: str) -> tuple[int, int, int]:
    """Retorna (purchases, sales, decks) incrementos."""
    if "buy" in action_type:
        return (1, 0, 0)
    if "sell" in action_type or "list" in action_type:
        return (0, 1, 0)
    if "deck" in action_type:
        return (0, 0, 1)
    return (0, 0, 0)


async def award_xp(
    session: AsyncSession,
    user_id: str,
    action_type: str,
    description: str | None = None,
) -> dict[str, Any]:
    """Concede XP ao usuário por uma ação."""
    xp_amount = XP_REWARDS.get(action_type, 0)
    if xp_amount <= 0:
        return {"success": False, "xp_earned": 0}

    await ensure_player_profile(session, user_id)
    purchase_inc, sales_inc, deck_inc = _stat_increments(action_type)
    desc = description or f"+{xp_amount} XP por {action_type}"

    existing = (
        await session.execute(
            text("SELECT total_xp FROM tcg_judge.user_xp WHERE user_id = :uid"),
            {"uid": user_id},
        )
    ).mappings().first()

    if existing:
        new_total = int(existing["total_xp"]) + xp_amount
        await session.execute(
            text(
                """
                UPDATE tcg_judge.user_xp
                SET total_xp = :total,
                    total_purchases = total_purchases + :purchases,
                    total_sales = total_sales + :sales,
                    decks_created = decks_created + :decks
                WHERE user_id = :uid
                """
            ),
            {
                "uid": user_id,
                "total": new_total,
                "purchases": purchase_inc,
                "sales": sales_inc,
                "decks": deck_inc,
            },
        )
    else:
        new_total = xp_amount
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.user_xp (
                  user_id, total_xp, total_purchases, total_sales, decks_created
                ) VALUES (:uid, :total, :purchases, :sales, :decks)
                """
            ),
            {
                "uid": user_id,
                "total": new_total,
                "purchases": purchase_inc,
                "sales": sales_inc,
                "decks": deck_inc,
            },
        )

    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.xp_transactions (user_id, action_type, xp_earned, description)
            VALUES (:uid, :action, :xp, :desc)
            """
        ),
        {"uid": user_id, "action": action_type, "xp": xp_amount, "desc": desc},
    )

    return {"success": True, "xp_earned": xp_amount, "total_xp": new_total}


async def award_xp_for_paid_order(session: AsyncSession, order_id: str) -> None:
    """Concede XP ao comprador e vendedor após pagamento confirmado."""
    order = (
        await session.execute(
            text(
                """
                SELECT o.buyer_id, o.total_cents, s.owner_id AS seller_id
                FROM tcg_judge.shop_orders o
                JOIN tcg_judge.stores s ON s.id = o.store_id
                WHERE o.id = :oid AND o.status = 'paid'
                """
            ),
            {"oid": order_id},
        )
    ).mappings().first()
    if not order:
        return

    total = int(order["total_cents"])
    buyer_id = str(order["buyer_id"])
    seller_id = str(order["seller_id"])
    await award_xp(session, buyer_id, "buy_card", f"Compra confirmada — R$ {total / 100:.2f}")
    if seller_id != buyer_id:
        await award_xp(session, seller_id, "sell_card", f"Venda confirmada — R$ {total / 100:.2f}")


def _xp_payload(data: dict[str, Any] | None) -> dict[str, Any]:
    if not data:
        return {
            "total_xp": 0,
            "current_level": "bronze",
            "level_name": "Bronze",
            "color_hex": DEFAULT_BENEFITS["color_hex"],
            "xp_to_next": 1000,
            "progress_percent": 0,
            "benefits": {
                "cashback_percent": 0,
                "free_shipping_threshold": None,
                "max_alerts": 10,
            },
            "stats": {"purchases": 0, "sales": 0, "decks": 0},
        }

    level = str(data.get("current_level") or "bronze")
    current_min = LEVEL_MINS.get(level, 0)
    next_min = NEXT_LEVEL_MINS.get(level, 30000)
    total_xp = int(data.get("total_xp") or 0)
    span = max(next_min - current_min, 1)
    progress = ((total_xp - current_min) / span) * 100

    return {
        "total_xp": total_xp,
        "current_level": level,
        "level_name": data.get("level_name") or "Bronze",
        "color_hex": data.get("color_hex") or DEFAULT_BENEFITS["color_hex"],
        "xp_to_next": max(next_min - total_xp, 0) if level != "judge" else 0,
        "progress_percent": min(round(progress, 1), 100),
        "benefits": {
            "cashback_percent": float(data.get("cashback_percent") or 0),
            "free_shipping_threshold": data.get("free_shipping_threshold"),
            "max_alerts": int(data.get("max_alerts") or 10),
        },
        "stats": {
            "purchases": int(data.get("total_purchases") or 0),
            "sales": int(data.get("total_sales") or 0),
            "decks": int(data.get("decks_created") or 0),
        },
    }


async def get_my_xp(session: AsyncSession, user_id: str) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                SELECT ux.total_xp, ux.current_level::text AS current_level,
                       ux.total_purchases, ux.total_sales, ux.decks_created,
                       lb.name AS level_name, lb.color_hex,
                       lb.cashback_percent, lb.free_shipping_threshold, lb.max_alerts
                FROM tcg_judge.user_xp ux
                LEFT JOIN tcg_judge.level_benefits lb ON lb.level = ux.current_level
                WHERE ux.user_id = :uid
                """
            ),
            {"uid": user_id},
        )
    ).mappings().first()
    return _xp_payload(dict(row) if row else None)


async def get_leaderboard(session: AsyncSession, *, limit: int = 50) -> list[dict[str, Any]]:
    limit = max(1, min(limit, 100))
    rows = (
        await session.execute(
            text(
                """
                SELECT ux.total_xp, ux.current_level::text AS current_level,
                       pp.handle, pp.display_name, pp.avatar_url
                FROM tcg_judge.user_xp ux
                JOIN tcg_judge.player_profiles pp ON pp.id = ux.user_id
                ORDER BY ux.total_xp DESC
                LIMIT :lim
                """
            ),
            {"lim": limit},
        )
    ).mappings().all()

    return [
        {
            "rank": i + 1,
            "username": r["handle"] or r["display_name"],
            "display_name": r["display_name"],
            "avatar": r.get("avatar_url"),
            "total_xp": int(r["total_xp"]),
            "level": str(r["current_level"]),
        }
        for i, r in enumerate(rows)
    ]
