"""Dependências de autorização admin."""

from __future__ import annotations

from app.api.deps import DbSession
from fastapi import Header, HTTPException
from sqlalchemy import text


async def require_admin(
    session: DbSession,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> str:
    if not x_judge_user_id or not x_judge_user_id.strip():
        raise HTTPException(401, "Autenticação necessária")
    user_id = x_judge_user_id.strip()
    row = (
        await session.execute(
            text("SELECT role FROM tcg_judge.judge_profiles WHERE id = :id"),
            {"id": user_id},
        )
    ).mappings().first()
    if not row or row["role"] != "admin":
        raise HTTPException(403, "Acesso restrito a administradores")
    return user_id
