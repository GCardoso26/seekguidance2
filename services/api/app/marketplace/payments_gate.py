"""Gate de pagamentos — desabilitado até Go-Live."""

from __future__ import annotations

from fastapi import HTTPException

from app.core.config import Settings

DEFERRED_MSG = (
    "Pagamentos serão habilitados no Go-Live. "
    "Configure PAYMENTS_ENABLED=true e as chaves PIX no Render."
)


def is_payments_live(settings: Settings) -> bool:
    if not settings.payments_enabled:
        return False
    return bool(settings.platform_pix_key)


def payments_status(settings: Settings) -> str:
    if not settings.payments_enabled:
        return "deferred"
    if not settings.platform_pix_key:
        return "misconfigured"
    return "live"


def require_live_payments(settings: Settings) -> None:
    if not settings.payments_enabled:
        raise HTTPException(
            503,
            detail={"code": "payments_deferred", "message": DEFERRED_MSG},
        )
    if not settings.platform_pix_key:
        raise HTTPException(
            503,
            detail={
                "code": "payments_not_configured",
                "message": "Configure PLATFORM_PIX_KEY (ou ESCROW_PIX_KEY) no Render.",
            },
        )
