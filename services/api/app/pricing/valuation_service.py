"""Valuation com explicação por card_id — Sprint 7."""

from __future__ import annotations

import os
from typing import Any
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.pricing.tcgapi_sync import fetch_tcgapi_price_cents

CONDITION_MULTIPLIER: dict[str, float] = {
    "NM": 1.0,
    "LP": 0.85,
    "MP": 0.7,
    "HP": 0.5,
    "DM": 0.3,
}

WEIGHTS = {"tcgapi": 0.45, "catalog": 0.35, "local": 0.2}


def _usd_to_brl_cents(usd_cents: int) -> int:
    rate = float(os.getenv("FX_USD_BRL", "5.5"))
    return int(round(usd_cents * rate))


async def get_card_valuation(
    session: AsyncSession,
    card_id: str,
    *,
    condition: str = "NM",
) -> dict[str, Any]:
    try:
        cid = UUID(card_id)
    except ValueError as exc:
        raise HTTPException(400, "card_id inválido") from exc

    card = (
        await session.execute(
            text(
                """
                SELECT cc.id, cc.name, cc.game_code,
                  latest.price_cents AS catalog_price_cents,
                  latest.currency AS catalog_currency,
                  week_ago.week_ago_cents
                FROM tcg_judge.card_catalog cc
                LEFT JOIN LATERAL (
                  SELECT cp.price_cents, cp.currency
                  FROM tcg_judge.card_prices cp
                  WHERE cp.card_id = cc.id
                  ORDER BY cp.recorded_at DESC
                  LIMIT 1
                ) latest ON TRUE
                LEFT JOIN LATERAL (
                  SELECT cp.price_cents AS week_ago_cents
                  FROM tcg_judge.card_prices cp
                  WHERE cp.card_id = cc.id
                    AND cp.recorded_at <= NOW() - INTERVAL '7 days'
                  ORDER BY cp.recorded_at DESC
                  LIMIT 1
                ) week_ago ON TRUE
                WHERE cc.id = :id
                """
            ),
            {"id": cid},
        )
    ).mappings().first()
    if not card:
        raise HTTPException(404, "Carta não encontrada")

    card_name = str(card["name"])
    game_code = str(card["game_code"] or "MTG").lower()

    local_row = (
        await session.execute(
            text(
                """
                SELECT COALESCE(AVG(price_cents), 0)::int AS avg_cents,
                  COUNT(*)::int AS listings_count
                FROM tcg_judge.card_listings
                WHERE card_id = :cid AND status = 'active'
                """
            ),
            {"cid": cid},
        )
    ).mappings().first()
    local_avg = int(local_row["avg_cents"] if local_row else 0)
    local_count = int(local_row["listings_count"] if local_row else 0)

    tcg_usd_cents = await fetch_tcgapi_price_cents(card_name, game=game_code)
    catalog_cents = int(card["catalog_price_cents"] or 0)
    catalog_currency = str(card["catalog_currency"] or "USD").upper()

    catalog_brl = (
        catalog_cents
        if catalog_currency == "BRL"
        else _usd_to_brl_cents(catalog_cents) if catalog_cents > 0 else None
    )
    tcg_brl = _usd_to_brl_cents(tcg_usd_cents) if tcg_usd_cents else None
    local_brl = local_avg if local_avg > 0 else None

    weighted = 0.0
    total_weight = 0.0
    if tcg_brl:
        weighted += tcg_brl * WEIGHTS["tcgapi"]
        total_weight += WEIGHTS["tcgapi"]
    if catalog_brl:
        weighted += catalog_brl * WEIGHTS["catalog"]
        total_weight += WEIGHTS["catalog"]
    if local_brl:
        weighted += local_brl * WEIGHTS["local"]
        total_weight += WEIGHTS["local"]

    cond_mult = CONDITION_MULTIPLIER.get(condition.upper(), 1.0)
    fair_cents = (
        int(round((weighted / total_weight) * cond_mult))
        if total_weight > 0
        else int(round((local_brl or catalog_brl or tcg_brl or 0) * cond_mult))
    )

    week_ago = int(card["week_ago_cents"] or 0)
    trend_pct = 0.0
    if week_ago > 0 and catalog_cents > 0:
        trend_pct = round((catalog_cents - week_ago) / week_ago * 100, 1)

    sources = sum(1 for v in (tcg_brl, catalog_brl, local_brl) if v)
    confidence = "high" if sources >= 3 else "medium" if sources == 2 else "low"

    return {
        "card_id": str(cid),
        "cardName": card_name,
        "condition": condition.upper(),
        "ourPriceCents": fair_cents,
        "confidence": confidence,
        "explanation": {
            "summary": (
                f"Preço estimado com {sources} fonte(s). "
                f"Tendência de {'alta' if trend_pct > 0 else 'baixa' if trend_pct < 0 else 'estabilidade'} "
                f"de {abs(trend_pct):.1f}% em 7 dias."
            ),
            "factors": [
                {
                    "name": "TCGPlayer (tcgapi.dev)",
                    "impact": "positive" if trend_pct > 5 else "negative" if trend_pct < -5 else "neutral",
                    "description": (
                        f"Referência US convertida: R$ {tcg_brl / 100:.2f}"
                        if tcg_brl
                        else "Dados indisponíveis (configure TCG_API_KEY)"
                    ),
                    "weight": WEIGHTS["tcgapi"],
                },
                {
                    "name": "Catálogo Judge",
                    "impact": "neutral",
                    "description": (
                        f"Último preço registrado: {catalog_currency} {catalog_cents / 100:.2f}"
                        if catalog_cents
                        else "Sem histórico no catálogo"
                    ),
                    "weight": WEIGHTS["catalog"],
                },
                {
                    "name": "Mercado brasileiro",
                    "impact": "neutral",
                    "description": (
                        f"Média local: R$ {local_avg / 100:.2f} ({local_count} listagens)"
                        if local_count
                        else "Sem listagens ativas"
                    ),
                    "weight": WEIGHTS["local"],
                },
                {
                    "name": "Condição",
                    "impact": "positive" if cond_mult >= 1 else "negative",
                    "description": f"Condição {condition.upper()}: {cond_mult * 100:.0f}% do NM",
                    "weight": 0.1,
                },
            ],
            "trendAnalysis": {
                "direction": "up" if trend_pct > 2 else "down" if trend_pct < -2 else "stable",
                "percentage": abs(trend_pct),
                "period": "7 dias",
                "reasoning": (
                    "Alta demanda recente no catálogo."
                    if trend_pct > 5
                    else "Queda recente no histórico de preços."
                    if trend_pct < -5
                    else "Preço estável no período."
                ),
            },
        },
        "marketData": {
            "tcgapi_usd_cents": tcg_usd_cents,
            "catalog_price_cents": catalog_cents,
            "catalog_currency": catalog_currency,
            "local": {"averagePrice": local_avg, "listingsCount": local_count},
        },
    }
