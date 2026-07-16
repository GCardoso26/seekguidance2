"""APP_MODE helpers — production fail-closed."""

from __future__ import annotations

from typing import Literal

from app.core.config import get_settings

AppMode = Literal["production", "beta", "sandbox", "development"]

_ALLOWED = frozenset({"production", "beta", "sandbox", "development"})


def get_app_mode() -> AppMode:
    settings = get_settings()
    # Fail-closed: ENVIRONMENT=production sempre vence APP_MODE.
    if (settings.environment or "").strip().lower() == "production":
        return "production"
    raw = (getattr(settings, "app_mode", None) or "development").strip().lower()
    if raw not in _ALLOWED:
        return "development"
    return raw  # type: ignore[return-value]


def is_production_mode() -> bool:
    return get_app_mode() == "production"


def is_sandbox_elevatable() -> bool:
    """Sandbox entitlements only in sandbox/development — never production or beta."""
    return get_app_mode() in ("sandbox", "development")


def can_run_seed_demo() -> bool:
    mode = get_app_mode()
    settings = get_settings()
    if mode == "production":
        return False
    if mode == "beta":
        return bool(settings.seed_demo_force)
    return True
