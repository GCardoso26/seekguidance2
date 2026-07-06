"""Idempotência de webhooks Stripe (deduplicação por event.id + payload hash v2)."""

from __future__ import annotations

import hashlib

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)


def compute_payload_hash(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


async def begin_stripe_webhook_event(
    session: AsyncSession,
    event_id: str,
    event_type: str,
    *,
    payload_hash: str | None = None,
    correlation_id: str | None = None,
) -> bool:
    """Reserva o evento. Retorna False se já foi processado (reentrega Stripe)."""
    if not event_id:
        return True

    if payload_hash:
        dup_hash = (
            await session.execute(
                text(
                    """
                    SELECT event_id FROM tcg_judge.stripe_webhook_events
                    WHERE payload_hash = :ph AND processing_status = 'completed'
                    LIMIT 1
                    """
                ),
                {"ph": payload_hash},
            )
        ).mappings().first()
        if dup_hash and str(dup_hash["event_id"]) != event_id:
            logger.info("stripe_webhook_hash_duplicate", event_id=event_id, payload_hash=payload_hash)
            return False

    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.stripe_webhook_events
                  (event_id, event_type, payload_hash, correlation_id, processing_status)
                VALUES (
                  :eid, :etype, :phash,
                  CAST(:cid AS uuid), 'processing'
                )
                ON CONFLICT (event_id) DO NOTHING
                RETURNING event_id
                """
            ),
            {
                "eid": event_id,
                "etype": event_type,
                "phash": payload_hash,
                "cid": correlation_id,
            },
        )
    ).mappings().first()
    return row is not None


async def complete_stripe_webhook_event(session: AsyncSession, event_id: str) -> None:
    if not event_id:
        return
    await session.execute(
        text(
            """
            UPDATE tcg_judge.stripe_webhook_events
            SET processing_status = 'completed', processed_at = NOW()
            WHERE event_id = :eid
            """
        ),
        {"eid": event_id},
    )


async def abort_stripe_webhook_event(session: AsyncSession, event_id: str) -> None:
    """Remove reserva para permitir retry do Stripe após falha de processamento."""
    if not event_id:
        return
    await session.execute(
        text("DELETE FROM tcg_judge.stripe_webhook_events WHERE event_id = :eid"),
        {"eid": event_id},
    )
    logger.warning("stripe_webhook_event_aborted", event_id=event_id)
