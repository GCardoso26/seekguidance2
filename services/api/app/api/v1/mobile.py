"""Rotas leves para mobile — sync incremental e auth (opcional)."""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/mobile", tags=["mobile"])


@router.get("/sync/status")
async def mobile_sync_status() -> dict[str, object]:
    return {
        "pending": 0,
        "assistant_notes": ["Delta sync; payloads compactos explainability-first."],
    }


@router.post("/sync/replay-delta")
async def mobile_sync_replay_delta() -> dict[str, object]:
    return {"accepted": True, "assistant_notes": ["Upload diferido suportado em modo offline-first."]}


@router.get("/auth/session-hints")
async def mobile_auth_session_hints() -> dict[str, object]:
    return {
        "cognito_optional": True,
        "firebase_optional": True,
        "custom_jwt": True,
        "assistant_notes": ["Nenhum fornecedor obrigatório; tokens nunca expostos em logs."],
    }
