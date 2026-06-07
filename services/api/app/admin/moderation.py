"""Moderação de usuários e torneios."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.audit import log_audit


async def ban_user(session: AsyncSession, admin_id: str, user_id: str, *, reason: str = "") -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.judge_profiles SET role = 'player'
                WHERE id = :id
                RETURNING id
                """
            ),
            {"id": user_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Usuário não encontrado")
    await session.execute(
        text("UPDATE tcg_judge.player_profiles SET privacy_level = 'private' WHERE id = :id"),
        {"id": user_id},
    )
    await log_audit(session, admin_id, "user.ban", "user", user_id, {"reason": reason})
    await session.commit()
    return {"userId": user_id, "banned": True}


async def moderate_tournament(
    session: AsyncSession,
    admin_id: str,
    tournament_id: str,
    *,
    action: str,
) -> dict[str, Any]:
    status_map = {"cancel": "cancelled", "pause": "published", "resume": "in_progress"}
    new_status = status_map.get(action)
    if not new_status:
        raise HTTPException(400, "Ação inválida")
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.tournaments SET status = :st, updated_at = NOW()
                WHERE id = :id RETURNING id, name, status
                """
            ),
            {"st": new_status, "id": tournament_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Torneio não encontrado")
    await log_audit(session, admin_id, f"tournament.{action}", "tournament", tournament_id, dict(row))
    await session.commit()
    return dict(row)
