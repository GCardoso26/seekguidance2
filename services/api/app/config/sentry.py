"""Integração opcional com Sentry (ativa só com SENTRY_DSN)."""

from __future__ import annotations

import os

import structlog

logger = structlog.get_logger(__name__)


def init_sentry() -> None:
    dsn = os.getenv("SENTRY_DSN", "").strip()
    if not dsn:
        return

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
    except ImportError:
        logger.warning("sentry_sdk not installed; skipping Sentry init")
        return

    environment = os.getenv("ENVIRONMENT", "development")
    traces_sample_rate = float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1"))

    sentry_sdk.init(
        dsn=dsn,
        environment=environment,
        integrations=[
            FastApiIntegration(),
            SqlalchemyIntegration(),
        ],
        traces_sample_rate=traces_sample_rate,
        send_default_pii=False,
    )
    logger.info("sentry_initialized", environment=environment)
