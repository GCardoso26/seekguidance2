"""Buyer Copilot — insights sugeridos (Sprint 14).

Não é chatbot. Nunca compra automaticamente. Sempre sugere.
Reutiliza pedidos, alertas de preço e produtos com boa confiança.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.buyer_recommendations import get_buyer_recommendations
from app.marketplace.marketplace_hygiene import PUBLIC_LISTING_SQL
from app.marketplace.shop_store import STORE_SELLABLE_SQL


async def _price_drop_candidates(session: AsyncSession, user_id: str, limit: int = 5) -> list[dict[str, Any]]:
    try:
        rows = (
            await session.execute(
                text(
                    """
                    SELECT pa.id, pa.product_id, pa.target_price, pa.baseline_price_cents,
                           pa.last_triggered_at, pa.is_active
                    FROM tcg_judge.price_alerts pa
                    WHERE pa.user_id = :uid AND pa.is_active
                    ORDER BY pa.last_triggered_at DESC NULLS LAST, pa.created_at DESC
                    LIMIT :lim
                    """
                ),
                {"uid": user_id, "lim": limit},
            )
        ).mappings().all()
        return [
            {
                "type": "price_drop",
                "priority": "high" if r.get("last_triggered_at") else "medium",
                "title": "Alerta de preço ativo",
                "description": f"Produto {r['product_id']} sob monitoramento.",
                "cta": {"label": "Ver alertas", "href": "/wishlist/alerts"},
                "meta": dict(r),
            }
            for r in rows
        ]
    except Exception:
        return []


async def _trusted_listings(session: AsyncSession, limit: int = 4) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                f"""
                SELECT p.id, p.name, p.price_cents, s.name AS store_name, s.slug,
                       s.verification_status,
                       COALESCE(s.average_rating, 0) AS average_rating,
                       COALESCE(s.review_count, 0) AS review_count,
                       (COALESCE(s.pix_key, '') <> '') AS accepts_pix,
                       (s.stripe_account_id IS NOT NULL AND s.stripe_onboarding_complete = true) AS accepts_card
                FROM tcg_judge.store_products p
                JOIN tcg_judge.stores s ON s.id = p.store_id
                WHERE p.is_active AND p.stock > 0
                  AND s.verification_status = 'verified'
                  AND {STORE_SELLABLE_SQL.strip()}
                  AND {PUBLIC_LISTING_SQL.strip()}
                ORDER BY
                  CASE WHEN COALESCE(s.review_count, 0) > 0 THEN s.average_rating ELSE 0 END DESC,
                  p.price_cents ASC
                LIMIT :lim
                """
            ),
            {"lim": limit},
        )
    ).mappings().all()
    return [
        {
            "type": "trusted_deal",
            "priority": "medium",
            "title": str(r["name"]),
            "description": (
                f"Loja verificada"
                + (
                    f" · ★ {float(r['average_rating']):.1f} ({int(r['review_count'])})"
                    if int(r["review_count"] or 0) > 0
                    else " · sem avaliações ainda"
                )
                + f" · R$ {int(r['price_cents']) / 100:.2f}"
            ),
            "cta": {"label": "Ver oferta", "href": f"/marketplace/product/{r['id']}"},
            "meta": {
                "product_id": str(r["id"]),
                "store_slug": r.get("slug"),
                "verification_status": r.get("verification_status"),
                "average_rating": float(r.get("average_rating") or 0),
                "review_count": int(r.get("review_count") or 0),
                "accepts_pix": bool(r.get("accepts_pix")),
                "accepts_card": bool(r.get("accepts_card")),
            },
        }
        for r in rows
    ]


async def get_buyer_insights(session: AsyncSession, user_id: str) -> dict[str, Any]:
    drops = await _price_drop_candidates(session, user_id)
    trusted = await _trusted_listings(session)
    recs = await get_buyer_recommendations(session, user_id, limit=6)

    opportunities = [
        {
            "type": "opportunity",
            "priority": "medium",
            "title": item["name"],
            "description": "Sugestão com base no seu histórico e no marketplace.",
            "cta": {"label": "Ver produto", "href": item["href"]},
            "meta": item,
        }
        for item in (recs.get("you_may_like") or [])[:3]
    ]

    insights = [*drops, *trusted, *opportunities]
    priority_rank = {"high": 0, "medium": 1, "low": 2}
    insights.sort(key=lambda i: priority_rank.get(str(i.get("priority")), 9))

    return {
        "summary": (
            f"Encontrei {len(insights)} oportunidades para você. "
            "Nenhuma compra será feita automaticamente."
        ),
        "insights": insights[:12],
        "recommendations": recs,
        "policy": {
            "never_auto_buy": True,
            "suggest_only": True,
        },
    }
