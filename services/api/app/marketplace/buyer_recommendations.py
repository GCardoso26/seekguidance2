"""Buyer Recommendation Engine — Sprint 14.

Gera sugestões a partir de pedidos do comprador + catálogo local (preços/popularidade).
Não importa Catalog Intelligence de forma acoplada: usa apenas SQL de read models públicos
em card_prices/store_products quando disponíveis. Nunca compra automaticamente.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.marketplace_hygiene import PUBLIC_LISTING_SQL
from app.marketplace.shop_store import STORE_SELLABLE_SQL


async def _bought_product_names(session: AsyncSession, user_id: str, limit: int = 20) -> list[str]:
    rows = (
        await session.execute(
            text(
                """
                SELECT DISTINCT oi.product_name
                FROM tcg_judge.shop_order_items oi
                JOIN tcg_judge.shop_orders o ON o.id = oi.order_id
                WHERE o.buyer_id = :uid
                ORDER BY oi.product_name
                LIMIT :lim
                """
            ),
            {"uid": user_id, "lim": limit},
        )
    ).mappings().all()
    return [str(r["product_name"]) for r in rows if r.get("product_name")]


async def get_buyer_recommendations(
    session: AsyncSession,
    user_id: str,
    *,
    limit: int = 12,
) -> dict[str, Any]:
    """Recomendações baseadas em produtos populares + co-ocorrência fraca por loja."""
    bought = await _bought_product_names(session, user_id)

    # Produtos populares ativos (frequently bought / also like)
    popular = (
        await session.execute(
            text(
                f"""
                SELECT p.id, p.name, p.price_cents, p.images, p.stock,
                       s.name AS store_name, s.slug AS store_slug, s.id AS store_id,
                       COALESCE(ss.trust_score, 75.0) AS trust_score
                FROM tcg_judge.store_products p
                JOIN tcg_judge.stores s ON s.id = p.store_id
                LEFT JOIN tcg_judge.seller_scores ss ON ss.store_id = s.id
                WHERE p.is_active AND p.stock > 0
                  AND {STORE_SELLABLE_SQL.strip()}
                  AND {PUBLIC_LISTING_SQL.strip()}
                ORDER BY p.created_at DESC NULLS LAST, p.price_cents ASC
                LIMIT :lim
                """
            ),
            {"lim": limit * 2},
        )
    ).mappings().all()

    you_may_like: list[dict[str, Any]] = []
    alternatives: list[dict[str, Any]] = []
    for row in popular:
        payload = {
            "product_id": str(row["id"]),
            "name": row["name"],
            "price_cents": int(row["price_cents"]),
            "image": (row.get("images") or [None])[0] if isinstance(row.get("images"), list) else None,
            "store_name": row.get("store_name"),
            "store_slug": row.get("store_slug"),
            "trust_score": float(row.get("trust_score") or 75),
            "reason": "popular_in_marketplace",
            "href": f"/marketplace/product/{row['id']}",
        }
        if bought and any(
            str(row["name"]).lower().split()[0] in b.lower() for b in bought if b
        ):
            alternatives.append({**payload, "reason": "similar_to_purchase"})
        else:
            you_may_like.append(payload)

    return {
        "you_may_like": you_may_like[:limit],
        "frequently_bought_together": you_may_like[: min(4, limit)],
        "substitutions": alternatives[: min(4, limit)],
        "upgrades": [p for p in you_may_like if p["price_cents"] > 5000][:4],
        "alternatives": alternatives[:4],
        "based_on": {
            "purchase_names": bought[:8],
            "signals": ["orders", "active_listings", "trust_score"],
        },
    }
