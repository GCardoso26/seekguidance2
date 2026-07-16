"""SUPER_ADMIN elevation for sandbox admins."""

from __future__ import annotations

from app.core.config import get_settings
from app.sandbox.mode import is_sandbox_elevatable


def _allowlist() -> set[str]:
    raw = (get_settings().sandbox_admin_emails or "").strip()
    if not raw:
        return set()
    return {e.strip().lower() for e in raw.split(",") if e.strip()}


def is_sandbox_admin(email: str | None, user_id: str | None = None) -> bool:
    """True only when APP_MODE allows elevation AND identity is allowlisted.

    If allowlist empty in sandbox/development, any authenticated user_id elevates
    (local DX). Production never reaches this path via is_sandbox_elevatable().
    """
    if not is_sandbox_elevatable():
        return False
    allow = _allowlist()
    if not allow:
        return bool(user_id or email)
    if email and email.strip().lower() in allow:
        return True
    if user_id and user_id.strip().lower() in allow:
        return True
    return False


def sandbox_status_payload(*, email: str | None, user_id: str | None) -> dict:
    from app.sandbox.mode import get_app_mode

    elevated = is_sandbox_admin(email, user_id)
    demos_on = elevated
    return {
        "mode": get_app_mode(),
        "elevated": elevated,
        "role": "SUPER_ADMIN" if elevated else None,
        "demos": {
            "store": demos_on,
            "events": demos_on,
            "financial": demos_on,
            "tournament": demos_on,
            "analytics": demos_on,
        },
        "plans": ["free", "lojista", "pro", "enterprise"] if elevated else [],
        "wallet_full": demos_on,
    }
