"""Verificação de lojas."""

from __future__ import annotations

import json
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def request_verification(
    session: AsyncSession,
    store_id: str,
    owner_id: str,
    *,
    documents: list[str] | None = None,
) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.stores SET
                  verification_status = 'pending',
                  verification_documents = CAST(:docs AS jsonb),
                  updated_at = NOW()
                WHERE id = :id AND owner_id = :oid
                RETURNING id, verification_status
                """
            ),
            {"id": store_id, "oid": owner_id, "docs": json.dumps(documents or [])},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Loja não encontrada")
    await session.commit()
    return dict(row)


async def approve_verification(
    session: AsyncSession,
    store_id: str,
    admin_id: str,
) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.stores SET
                  verification_status = 'verified',
                  verified_at = NOW(),
                  verified_by = :admin,
                  updated_at = NOW()
                WHERE id = :id RETURNING *
                """
            ),
            {"id": store_id, "admin": admin_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Loja não encontrada")
    await session.commit()
    return dict(row)
