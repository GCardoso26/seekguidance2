"""Idempotência de webhooks Stripe (deduplicação por event.id)."""

from __future__ import annotations

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)


async def begin_stripe_webhook_event(session: AsyncSession, event_id: str, event_type: str) -> bool:
    """Reserva o evento. Retorna False se já foi processado (reentrega Stripe)."""
    if not event_id:
        return True

    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.stripe_webhook_events (event_id, event_type)
                VALUES (:eid, :etype)
                ON CONFLICT (event_id) DO NOTHING
                RETURNING event_id
                """
            ),
            {"eid": event_id, "etype": event_type},
        )
    ).mappings().first()
    return row is not None


async def abort_stripe_webhook_event(session: AsyncSession, event_id: str) -> None:
    """Remove reserva para permitir retry do Stripe após falha de processamento."""
    if not event_id:
        return
    await session.execute(
        text("DELETE FROM tcg_judge.stripe_webhook_events WHERE event_id = :eid"),
        {"eid": event_id},
    )
    logger.warning("stripe_webhook_event_aborted", event_id=event_id)
