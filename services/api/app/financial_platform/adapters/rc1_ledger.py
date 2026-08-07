"""Dual-read Sprint 6 ledger / settlements / chargebacks."""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def list_sprint6_ledger(session: AsyncSession, limit: int = 50) -> list[dict[str, Any]]:
    try:
        rows = (
            await session.execute(
                text(
                    """
                    SELECT id::text, payment_id::text, entry_type, amount_cents, currency,
                           created_at::text
                    FROM tcg_judge.ledger_entries
                    ORDER BY created_at DESC
                    LIMIT :lim
                    """
                ),
                {"lim": limit},
            )
        ).mappings().all()
        return [dict(r) for r in rows]
    except Exception:
        return []


async def list_settlements(
    session: AsyncSession,
    limit: int = 50,
    *,
    store_id: str | None = None,
) -> list[dict[str, Any]]:
    try:
        if store_id:
            rows = (
                await session.execute(
                    text(
                        """
                        SELECT id::text, status, created_at::text
                        FROM tcg_judge.settlements
                        WHERE store_id = CAST(:sid AS uuid)
                        ORDER BY created_at DESC
                        LIMIT :lim
                        """
                    ),
                    {"lim": limit, "sid": store_id},
                )
            ).mappings().all()
        else:
            rows = (
                await session.execute(
                    text(
                        """
                        SELECT id::text, status, created_at::text
                        FROM tcg_judge.settlements
                        ORDER BY created_at DESC
                        LIMIT :lim
                        """
                    ),
                    {"lim": limit},
                )
            ).mappings().all()
        return [dict(r) for r in rows]
    except Exception:
        return []


async def list_chargebacks(session: AsyncSession, limit: int = 50) -> list[dict[str, Any]]:
    try:
        rows = (
            await session.execute(
                text(
                    """
                    SELECT id::text, status, amount_cents, created_at::text
                    FROM tcg_judge.chargebacks
                    ORDER BY created_at DESC
                    LIMIT :lim
                    """
                ),
                {"lim": limit},
            )
        ).mappings().all()
        return [dict(r) for r in rows]
    except Exception:
        return []
