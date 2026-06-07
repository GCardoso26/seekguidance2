"""Patrocínios de torneios."""

from __future__ import annotations

import json
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

SPONSORSHIP_TIERS = {
    "small": {"amount_cents": 5000, "benefits": [{"type": "logo_on_stream", "size": "small"}]},
    "medium": {
        "amount_cents": 15000,
        "benefits": [
            {"type": "logo_on_stream", "size": "medium"},
            {"type": "announcement", "text": "Patrocinado por nosso parceiro"},
        ],
    },
    "large": {
        "amount_cents": 50000,
        "benefits": [
            {"type": "logo_on_stream", "size": "large"},
            {"type": "prize_pool_contribution", "amount": 50000},
        ],
    },
}


async def create_sponsorship(
    session: AsyncSession,
    sponsor_id: str,
    tournament_id: str,
    tier: str,
) -> dict[str, Any]:
    tier_data = SPONSORSHIP_TIERS.get(tier)
    if not tier_data:
        raise HTTPException(400, "Tier inválido")
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.sponsorships (
                  sponsor_id, tournament_id, amount_cents, status, benefits
                ) VALUES (
                  :sid, :tid, :amt, 'active', CAST(:ben AS jsonb)
                )
                RETURNING *
                """
            ),
            {
                "sid": sponsor_id,
                "tid": tournament_id,
                "amt": tier_data["amount_cents"],
                "ben": json.dumps(tier_data["benefits"]),
            },
        )
    ).mappings().first()
    await session.commit()
    return dict(row) if row else {}
