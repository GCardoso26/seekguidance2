"""Sandbox status API."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Header

from app.sandbox.entitlements import sandbox_status_payload

router = APIRouter(prefix="/runtime/judge/sandbox", tags=["sandbox"])


@router.get("/status")
async def sandbox_status(
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
    x_judge_user_email: str | None = Header(default=None, alias="X-Judge-User-Email"),
) -> dict[str, Any]:
    return sandbox_status_payload(email=x_judge_user_email, user_id=x_judge_user_id)
