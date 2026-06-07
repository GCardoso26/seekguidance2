"""Logs de auditoria."""

from __future__ import annotations

import json
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def log_audit(
    session: AsyncSession,
    actor_id: str,
    action: str,
    target_type: str | None = None,
    target_id: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.audit_logs (actor_id, action, target_type, target_id, metadata)
            VALUES (:actor, :action, :tt, :tid, CAST(:meta AS jsonb))
            """
        ),
        {
            "actor": actor_id,
            "action": action,
            "tt": target_type,
            "tid": target_id,
            "meta": json.dumps(metadata or {}),
        },
    )


async def list_audit_logs(session: AsyncSession, *, limit: int = 50) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.audit_logs
                ORDER BY created_at DESC LIMIT :lim
                """
            ),
            {"lim": limit},
        )
    ).mappings().all()
    return [dict(r) for r in rows]
