"""Health checks para produção."""

from __future__ import annotations

import os
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import text

APP_VERSION = "1.0.0"


async def check_database() -> bool:
    try:
        from app.infrastructure.db.session import get_session_factory

        async with get_session_factory()() as session:
            await session.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


async def check_redis() -> str:
    redis_url = os.getenv("REDIS_URL", "").strip()
    if not redis_url:
        return "disabled"
    try:
        import redis.asyncio as aioredis

        client = aioredis.from_url(redis_url, socket_connect_timeout=2)
        try:
            pong = await client.ping()
            return "ok" if pong else "error"
        finally:
            await client.aclose()
    except Exception:
        return "error"


def service_status(env_key: str) -> str:
    return "ok" if os.getenv(env_key) else "disabled"


def platform_pix_status() -> str:
    keys = ("PLATFORM_PIX_KEY", "ESCROW_PIX_KEY", "OPENPIX_API_KEY")
    return "ok" if any(os.getenv(k) for k in keys) else "disabled"


def payments_gate_status() -> str:
    from app.core.config import get_settings
    from app.marketplace.payments_gate import payments_status

    return payments_status(get_settings())


async def build_health_payload() -> dict[str, Any]:
    from app.integrations.melhor_envio.validate import melhor_envio_config_snapshot
    from app.marketplace.freight_quote import shipping_v2_enabled

    db_ok = await check_database()
    redis_status = await check_redis()
    core_ok = db_ok and redis_status in {"ok", "disabled"}

    # Render injeta RENDER_GIT_COMMIT no deploy — útil para confirmar se o build novo está vivo.
    git_commit = (
        os.getenv("RENDER_GIT_COMMIT")
        or os.getenv("GIT_COMMIT")
        or os.getenv("COMMIT_SHA")
        or ""
    ).strip()[:40] or None

    return {
        "status": "healthy" if core_ok else "degraded",
        "timestamp": datetime.now(UTC).isoformat(),
        "version": APP_VERSION,
        "gitCommit": git_commit,
        "buildStamp": "catalog-detail-null-price-fix",
        "services": {
            "database": "ok" if db_ok else "error",
            "redis": redis_status,
            "stripe": service_status("STRIPE_SECRET_KEY"),
            "openpix": service_status("OPENPIX_API_KEY"),
            "platform_pix": platform_pix_status(),
            "payments": payments_gate_status(),
            "fcm": service_status("FIREBASE_PROJECT_ID"),
            "vapid": service_status("VAPID_PRIVATE_KEY"),
            "sentry": service_status("SENTRY_DSN"),
            "melhor_envio": melhor_envio_config_snapshot(),
        },
        "features": {
            "shipping_v2": shipping_v2_enabled(),
        },
    }
