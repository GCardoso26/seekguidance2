"""Dual-read marketplace escrow tables."""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def list_escrow_transactions(
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
                        SELECT et.id::text, et.status, et.amount_cents, et.created_at::text
                        FROM tcg_judge.escrow_transactions et
                        INNER JOIN tcg_judge.shop_orders o ON o.id = et.shop_order_id
                        WHERE o.store_id = CAST(:sid AS uuid)
                        ORDER BY et.created_at DESC
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
