"""Buyer Dashboard Read Model — Sprint 14.

Agrega pedidos, wishlist (se disponível), coleção, carrinho e alertas.
Somente leitura. Não acopla Catalog. Não executa SQL no frontend.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace import shop_cart, shop_orders

IN_PROGRESS = frozenset({"pending", "paid", "processing", "shipped"})


async def _collection_snapshot(session: AsyncSession, user_id: str) -> dict[str, Any]:
    try:
        row = (
            await session.execute(
                text(
                    """
                    SELECT COUNT(*)::int AS qty,
                           COUNT(DISTINCT card_id)::int AS unique_cards
                    FROM tcg_judge.user_collections
                    WHERE user_id = :uid
                    """
                ),
                {"uid": user_id},
            )
        ).mappings().first()
        return {
            "quantity": int(row["qty"] if row else 0),
            "unique_cards": int(row["unique_cards"] if row else 0),
        }
    except Exception:
        return {"quantity": 0, "unique_cards": 0}


async def _wishlist_snapshot(session: AsyncSession, user_id: str) -> dict[str, Any]:
    """Wishlist pode viver só no BFF mock — tenta tabela se existir."""
    try:
        row = (
            await session.execute(
                text(
                    """
                    SELECT COUNT(*)::int AS c
                    FROM tcg_judge.wishlists
                    WHERE user_id = :uid
                    """
                ),
                {"uid": user_id},
            )
        ).mappings().first()
        return {"total": int(row["c"] if row else 0), "source": "db"}
    except Exception:
        return {"total": 0, "source": "unavailable"}


async def _alerts_snapshot(session: AsyncSession, user_id: str) -> dict[str, Any]:
    try:
        row = (
            await session.execute(
                text(
                    """
                    SELECT COUNT(*) FILTER (WHERE is_active)::int AS active,
                           COUNT(*) FILTER (WHERE last_triggered_at IS NOT NULL)::int AS triggered
                    FROM tcg_judge.price_alerts
                    WHERE user_id = :uid
                    """
                ),
                {"uid": user_id},
            )
        ).mappings().first()
        return {
            "active": int(row["active"] if row else 0),
            "triggered": int(row["triggered"] if row else 0),
        }
    except Exception:
        return {"active": 0, "triggered": 0}


async def _savings_from_orders(session: AsyncSession, user_id: str) -> int:
    """Economia aproximada = compare_at implícito via discount_cents se existir."""
    try:
        row = (
            await session.execute(
                text(
                    """
                    SELECT COALESCE(SUM(
                      CASE
                        WHEN o.discount_cents IS NOT NULL THEN o.discount_cents
                        ELSE 0
                      END
                    ), 0)::int AS saved
                    FROM tcg_judge.shop_orders o
                    WHERE o.buyer_id = :uid AND o.status NOT IN ('cancelled')
                    """
                ),
                {"uid": user_id},
            )
        ).mappings().first()
        return int(row["saved"] if row else 0)
    except Exception:
        return 0


async def _favorite_stores(session: AsyncSession, user_id: str, limit: int = 5) -> list[dict[str, Any]]:
    """Lojas mais frequentes nos pedidos do comprador (proxy de favoritas)."""
    try:
        rows = (
            await session.execute(
                text(
                    """
                    SELECT s.id, s.name, s.slug, s.average_rating, s.review_count,
                           COUNT(*)::int AS order_count,
                           COALESCE(ss.trust_score, 75.0) AS trust_score
                    FROM tcg_judge.shop_orders o
                    JOIN tcg_judge.stores s ON s.id = o.store_id
                    LEFT JOIN tcg_judge.seller_scores ss ON ss.store_id = s.id
                    WHERE o.buyer_id = :uid AND o.status NOT IN ('cancelled')
                    GROUP BY s.id, s.name, s.slug, s.average_rating, s.review_count, ss.trust_score
                    ORDER BY order_count DESC
                    LIMIT :lim
                    """
                ),
                {"uid": user_id, "lim": limit},
            )
        ).mappings().all()
        return [dict(r) for r in rows]
    except Exception:
        return []


async def get_buyer_dashboard(session: AsyncSession, user_id: str) -> dict[str, Any]:
    orders = await shop_orders.list_buyer_orders(session, user_id, limit=12)
    recent = [
        {
            "id": str(o["id"]),
            "status": o.get("status"),
            "total_cents": int(o.get("total_cents") or 0),
            "store_name": o.get("store_name"),
            "store_slug": o.get("store_slug"),
            "created_at": str(o.get("created_at") or ""),
            "use_escrow": bool(o.get("use_escrow")),
        }
        for o in orders
    ]
    in_progress = [o for o in recent if str(o.get("status")) in IN_PROGRESS]

    cart = await shop_cart.get_cart(session, user_id)
    cart_items = cart.get("items") or []
    if isinstance(cart_items, str):
        import json

        cart_items = json.loads(cart_items)

    collection, wishlist, alerts, savings, favorites = (
        await _collection_snapshot(session, user_id),
        await _wishlist_snapshot(session, user_id),
        await _alerts_snapshot(session, user_id),
        await _savings_from_orders(session, user_id),
        await _favorite_stores(session, user_id),
    )

    return {
        "buyer_id": user_id,
        "orders": {
            "recent": recent[:5],
            "in_progress": in_progress,
            "total": len(orders),
        },
        "cart": {
            "item_count": sum(int(i.get("quantity", 0)) for i in cart_items if isinstance(i, dict)),
            "total_cents": int(cart.get("total_cents") or 0),
        },
        "wishlist": wishlist,
        "collection": collection,
        "alerts": alerts,
        "savings_cents": savings,
        "favorite_stores": favorites,
        "recommended": [],  # preenchido pelo recommendation service no API layer
        "notifications_hint": "/notifications",
    }
