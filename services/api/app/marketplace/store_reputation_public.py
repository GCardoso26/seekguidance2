"""Experiência pública de reputação na página da loja — Sprint 14 Epic 10."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.reputation.reputation_engine import get_seller_reputation_dashboard


async def get_store_reputation_public(session: AsyncSession, slug: str) -> dict[str, Any]:
    store = (
        await session.execute(
            text(
                """
                SELECT id, name, slug, average_rating, review_count,
                       subscription_plan, description
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

    sla = rep.get("sla_detail") or {}
    avg_ship_hours = sla.get("avg_ship_hours") or sla.get("shipping_avg_hours")

    return {
        "store": {
            "id": store_id,
            "name": store["name"],
            "slug": store["slug"],
            "average_rating": float(store.get("average_rating") or 0),
            "review_count": int(store.get("review_count") or 0),
            "plan": store.get("subscription_plan"),
            "description": store.get("description"),
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
        "history_hint": "Histórico derivado do Reputation Engine (read model).",
    }
