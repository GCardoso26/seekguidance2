"""Observability emit helpers."""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger("financial_platform.observability")

FINANCIAL_PLATFORM_EVENTS = (
    "wallet_created",
    "wallet_transaction",
    "cashback_generated",
    "cashback_used",
    "giftcard_created",
    "giftcard_used",
    "escrow_created",
    "escrow_released",
    "split_created",
    "settlement_completed",
    "payout_requested",
    "payout_completed",
    "refund_requested",
    "refund_completed",
    "chargeback_received",
)


def emit(name: str, payload: dict[str, Any] | None = None) -> None:
    if name not in FINANCIAL_PLATFORM_EVENTS:
        logger.warning("unregistered_financial_event name=%s", name)
    try:
        from app.judge.event_registry import EVENT_REGISTRY

        if name not in EVENT_REGISTRY:
            logger.debug("event_not_in_registry_yet name=%s", name)
    except Exception:
        pass
    logger.info("fp_event name=%s payload=%s", name, payload or {})
