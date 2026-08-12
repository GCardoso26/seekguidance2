"""Experiência pública de reputação na página da loja — Sprint 14 Epic 10 + ADR-018 trust tiers."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.reputation.reputation_engine import get_seller_reputation_dashboard
from app.stores.trust_tiers import resolve_trust_tier, trust_tier_payload


async def get_store_reputation_public(session: AsyncSession, slug: str) -> dict[str, Any]:
    store = (
        await session.execute(
            text(
                """
                SELECT id, name, slug, average_rating, review_count,
                       subscription_plan, description, cnpj,
                       accreditation_status, verification_status, trust_tier,
                       verified_at
                FROM tcg_judge.stores
                WHERE slug = :slug
                """
            ),
            {"slug": slug},
        )
    ).mappings().first()
    if not store:
        raise HTTPException(404, "Loja não encontrada")

    store_id = str(store["id"])
    try:
        rep = await get_seller_reputation_dashboard(session, store_id)
    except Exception:
        rep = {
            "trust_score": 75.0,
            "seller_level": "new",
            "badges": [],
            "orders_completed": 0,
            "review_avg": float(store.get("average_rating") or 0),
            "review_count": int(store.get("review_count") or 0),
            "sla_violations": 0,
            "sla_detail": {},
            "alerts": [],
            "components": {},
        }

    listings_row = (
        await session.execute(
            text(
                """
                SELECT COUNT(*)::int AS c
                FROM tcg_judge.card_listings
                WHERE store_id = :sid AND status = 'active'
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()
    active_listings = int(listings_row["c"] if listings_row else 0)

    cancel_row = (
        await session.execute(
            text(
                """
                SELECT
                  COUNT(*)::int AS total,
                  COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled
                FROM tcg_judge.shop_orders
                WHERE store_id = :sid
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()
    total_orders = int(cancel_row["total"] if cancel_row else 0)
    cancelled = int(cancel_row["cancelled"] if cancel_row else 0)
    cancel_rate = (cancelled / total_orders) if total_orders else None

    sla = rep.get("sla_detail") or {}
    avg_ship_hours = sla.get("avg_ship_hours") or sla.get("shipping_avg_hours")
    ship_on_time = sla.get("on_time_rate") or sla.get("ship_on_time_rate")

    tier_id = resolve_trust_tier(
        dict(store),
        orders_completed=int(rep.get("orders_completed") or 0),
        active_listings=active_listings,
        review_avg=float(rep.get("review_avg") or store.get("average_rating") or 0),
        review_count=int(rep.get("review_count") or store.get("review_count") or 0),
        cancel_rate=cancel_rate,
        ship_on_time_rate=float(ship_on_time) if ship_on_time is not None else None,
        trust_score=float(rep.get("trust_score") or 0) or None,
    )

    # Persist cached tier when it changes
    if tier_id and tier_id != store.get("trust_tier"):
        await session.execute(
            text("UPDATE tcg_judge.stores SET trust_tier = :t, updated_at = NOW() WHERE id = :id"),
            {"t": tier_id, "id": store_id},
        )
        await session.commit()

    return {
        "store": {
            "id": store_id,
            "name": store["name"],
            "slug": store["slug"],
            "average_rating": float(store.get("average_rating") or 0),
            "review_count": int(store.get("review_count") or 0),
            "plan": store.get("subscription_plan"),
            "description": store.get("description"),
            "accreditation_status": store.get("accreditation_status"),
            "verification_status": store.get("verification_status"),
            "verified_at": str(store["verified_at"]) if store.get("verified_at") else None,
        },
        "trust_tier": trust_tier_payload(tier_id),
        "metrics": {
            "orders_completed": int(rep.get("orders_completed") or 0),
            "orders_total": total_orders,
            "cancel_rate": cancel_rate,
            "active_listings": active_listings,
            "review_avg": float(rep.get("review_avg") or store.get("average_rating") or 0),
            "review_count": int(rep.get("review_count") or store.get("review_count") or 0),
        },
        "trust_score": float(rep.get("trust_score") or 75),
        "seller_level": rep.get("seller_level") or "new",
        "badges": list(rep.get("badges") or []),
        "orders_completed": int(rep.get("orders_completed") or 0),
        "avg_shipping_hours": avg_ship_hours,
        "chargebacks_open": int(
            (rep.get("components") or {}).get("chargebacks_open")
            or next(
                (a for a in (rep.get("alerts") or []) if a.get("type") == "chargeback"),
                {},
            ).get("count")
            or 0
        ),
        "response_time_hours": sla.get("avg_response_hours"),
        "reputation": {
            "review_avg": float(rep.get("review_avg") or store.get("average_rating") or 0),
            "review_count": int(rep.get("review_count") or store.get("review_count") or 0),
            "components": rep.get("components") or {},
            "sla_violations": int(rep.get("sla_violations") or 0),
            "calculated_at": rep.get("calculated_at"),
        },
        "history_hint": "Histórico derivado do Reputation Engine + trust tiers ADR-018.",
    }
