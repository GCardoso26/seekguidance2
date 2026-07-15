"""RC1 store adapter."""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def get_store_row(session: AsyncSession, store_id: str) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text(
                """
                SELECT id, owner_id, name, slug, company_id, subscription_plan,
                       shop_enabled, verification_status
                FROM tcg_judge.stores
                WHERE id = CAST(:sid AS uuid)
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()
    return dict(row) if row else None


async def list_owner_stores(session: AsyncSession, owner_id: str) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT id, owner_id, name, slug, company_id, subscription_plan
                FROM tcg_judge.stores
                WHERE owner_id = :uid
                ORDER BY created_at ASC NULLS LAST
                """
            ),
            {"uid": owner_id},
        )
    ).mappings().all()
    return [dict(r) for r in rows]
