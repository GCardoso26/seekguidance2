"""Pricing intelligence — sugestões baseadas em mercado e catálogo."""

from __future__ import annotations

from typing import Any

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)

_SUGGEST_THRESHOLD_PCT = 8.0


async def compute_pricing_suggestions(
    session: AsyncSession,
    *,
    store_id: str,
    limit: int = 50,
) -> dict[str, Any]:
    owner = (
        await session.execute(
            text("SELECT owner_id FROM tcg_judge.stores WHERE id = CAST(:sid AS uuid)"),
            {"sid": store_id},
        )
    ).mappings().first()
    if not owner:
        return {"items": [], "total": 0}

    rows = (
        await session.execute(
            text(
                """
                SELECT
                  cl.id AS listing_id,
                  cl.card_id,
                  cl.price_cents AS listing_price_cents,
                  cc.name AS card_name,
                  latest.price_cents AS catalog_price_cents,
                  med.market_median_cents
                FROM tcg_judge.card_listings cl
                JOIN tcg_judge.card_catalog cc ON cc.id = cl.card_id
                LEFT JOIN LATERAL (
                  SELECT cp.price_cents
                  FROM tcg_judge.card_prices cp
                  WHERE cp.card_id = cl.card_id
                  ORDER BY cp.recorded_at DESC
                  LIMIT 1
                ) latest ON TRUE
                LEFT JOIN LATERAL (
                  SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cl2.price_cents)::int
                    AS market_median_cents
                  FROM tcg_judge.card_listings cl2
                  WHERE cl2.card_id = cl.card_id
                    AND cl2.status = 'active'
                    AND cl2.id != cl.id
                ) med ON TRUE
                WHERE cl.seller_id = :uid AND cl.status = 'active'
                ORDER BY cl.updated_at DESC
                LIMIT :lim
                """
            ),
            {"uid": str(owner["owner_id"]), "lim": limit},
        )
    ).mappings().all()

    items: list[dict[str, Any]] = []
    for row in rows:
        listing_price = int(row["listing_price_cents"])
        market = int(row["market_median_cents"] or row["catalog_price_cents"] or listing_price)
        if market <= 0:
            market = listing_price

        delta_pct = round((listing_price - market) / market * 100, 2) if market else 0.0
        if delta_pct > _SUGGEST_THRESHOLD_PCT:
            suggestion = "lower"
            suggested = max(1, int(market * 0.98))
        elif delta_pct < -_SUGGEST_THRESHOLD_PCT:
            suggestion = "raise"
            suggested = int(market * 1.02)
        else:
            suggestion = "hold"
            suggested = listing_price

        confidence = 0.7 if row.get("market_median_cents") else 0.45

        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.analytics_pricing_snapshots (
                  store_id, listing_id, card_id, listing_price_cents,
                  market_median_cents, catalog_price_cents, suggested_price_cents,
                  delta_pct, suggestion, confidence
                ) VALUES (
                  CAST(:sid AS uuid), CAST(:lid AS uuid), CAST(:cid AS uuid), :lp,
                  :market, :catalog, :suggested, :delta, :sugg, :conf
                )
                ON CONFLICT (store_id, listing_id) DO UPDATE SET
                  listing_price_cents = EXCLUDED.listing_price_cents,
                  market_median_cents = EXCLUDED.market_median_cents,
                  catalog_price_cents = EXCLUDED.catalog_price_cents,
                  suggested_price_cents = EXCLUDED.suggested_price_cents,
                  delta_pct = EXCLUDED.delta_pct,
                  suggestion = EXCLUDED.suggestion,
                  confidence = EXCLUDED.confidence,
                  calculated_at = NOW()
                """
            ),
            {
                "sid": store_id,
                "lid": str(row["listing_id"]),
                "cid": str(row["card_id"]),
                "lp": listing_price,
                "market": row.get("market_median_cents"),
                "catalog": row.get("catalog_price_cents"),
                "suggested": suggested,
                "delta": delta_pct,
                "sugg": suggestion,
                "conf": confidence,
            },
        )

        items.append({
            "listing_id": str(row["listing_id"]),
            "card_id": str(row["card_id"]),
            "card_name": str(row["card_name"]),
            "listing_price_cents": listing_price,
            "market_median_cents": market,
            "suggested_price_cents": suggested,
            "delta_pct": delta_pct,
            "suggestion": suggestion,
            "confidence": confidence,
        })

    opportunities = sum(1 for i in items if i["suggestion"] != "hold")
    return {"items": items, "total": len(items), "opportunities": opportunities}


async def get_pricing_suggestions_read(
    session: AsyncSession,
    *,
    store_id: str,
    limit: int = 30,
) -> dict[str, Any]:
    rows = (
        await session.execute(
            text(
                """
                SELECT aps.*, cc.name AS card_name
                FROM tcg_judge.analytics_pricing_snapshots aps
                JOIN tcg_judge.card_catalog cc ON cc.id = aps.card_id
                WHERE aps.store_id = CAST(:sid AS uuid)
                ORDER BY ABS(aps.delta_pct) DESC NULLS LAST
                LIMIT :lim
                """
            ),
            {"sid": store_id, "lim": limit},
        )
    ).mappings().all()
    items = [dict(r) for r in rows]
    if not items:
        return await compute_pricing_suggestions(session, store_id=store_id, limit=limit)
    return {
        "items": items,
        "total": len(items),
        "opportunities": sum(1 for i in items if str(i.get("suggestion")) != "hold"),
    }
