"""Dual-read marketplace escrow tables."""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def list_escrow_transactions(session: AsyncSession, limit: int = 50) -> list[dict[str, Any]]:
    try:
        rows = (
            await session.execute(
                text(
                    """
                    SELECT id::text, status, amount_cents, created_at::text
                    FROM tcg_judge.escrow_transactions
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
