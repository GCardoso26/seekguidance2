"""Assinaturas de lojas Pro/Enterprise."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

PLAN_PRICES_CENTS = {"pro": 4900, "enterprise": 19900}


async def subscribe_store(
    session: AsyncSession,
    store_id: str,
    owner_id: str,
    plan: str,
) -> dict[str, Any]:
    if plan not in PLAN_PRICES_CENTS:
        raise HTTPException(400, "Plano inválido")
    expires = datetime.now(UTC) + timedelta(days=30)
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.stores SET
                  subscription_plan = :plan,
                  subscription_expires_at = :exp,
                  updated_at = NOW()
                WHERE id = :id AND owner_id = :oid
                RETURNING *
                """
            ),
            {"plan": plan, "exp": expires, "id": store_id, "oid": owner_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Loja não encontrada")
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.store_subscriptions (store_id, plan, amount_cents, expires_at)
            VALUES (:sid, :plan, :amt, :exp)
            """
        ),
        {"sid": store_id, "plan": plan, "amt": PLAN_PRICES_CENTS[plan], "exp": expires},
    )
    await session.commit()
    return dict(row)
