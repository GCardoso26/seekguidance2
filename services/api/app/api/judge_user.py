"""Identidade do jogador nas rotas /runtime/judge (header + JWT verificado)."""

from __future__ import annotations

from fastapi import HTTPException

from app.core.config import get_settings
from app.core.security.judge_user_context import verified_judge_user_id


def require_judge_user(user_id: str | None) -> str:
    """Exige user_id do JWT verificado (middleware) ou header em dev sem enforcement."""
    verified = verified_judge_user_id.get()
    header = (user_id or "").strip()

    if verified:
        if header and header != verified:
            raise HTTPException(status_code=403, detail="Identidade do usuário inconsistente")
        return verified

    settings = get_settings()
    if settings.should_enforce_supabase_jwt():
        raise HTTPException(status_code=401, detail="Autenticação necessária")

    if not header:
        raise HTTPException(status_code=401, detail="Autenticação necessária")
    return header
