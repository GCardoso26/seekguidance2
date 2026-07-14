"""Chargeback automation — Stripe disputes + Payment aggregate."""

from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime
from typing import Any

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.payments.ledger import post_chargeback_reserve_entries
from app.payments.payment_aggregate import mark_payment_chargeback, upsert_payment_for_order
from app.platform.jobs import emit_outbox_event

logger = structlog.get_logger(__name__)

_DISPUTE_STATUS_MAP = {
    "warning_needs_response": "opened",
    "warning_under_review": "under_review",
    "warning_closed": "closed",
    "needs_response": "opened",
    "under_review": "under_review",
    "charge_refunded": "lost",
    "won": "won",
    "lost": "lost",
}


async def open_chargeback_from_stripe_dispute(
    session: AsyncSession,
    dispute: dict[str, Any],
    *,
    correlation_id: str | None = None,
) -> str | None:
    """Processa charge.dispute.created / updated do Stripe."""
    cid = correlation_id or str(uuid.uuid4())
    dispute_id = str(dispute.get("id") or "")
    if not dispute_id:
        return None

    existing = (
        await session.execute(
            text("SELECT id FROM tcg_judge.chargebacks WHERE stripe_dispute_id = :did"),
            {"did": dispute_id},
        )
    ).mappings().first()
    if existing:
        return await _update_chargeback_from_dispute(
            session, str(existing["id"]), dispute, correlation_id=cid
        )

    charge_id = dispute.get("charge")
    payment_intent_id = None
    if isinstance(charge_id, dict):
        payment_intent_id = charge_id.get("payment_intent")
        charge_id = charge_id.get("id")

    payment_row = None
    if payment_intent_id:
        payment_row = (
            await session.execute(
                text(
                    """
                    SELECT p.id, p.shop_order_id, p.store_id, p.status
                    FROM tcg_judge.payments p
                    WHERE p.stripe_payment_intent_id = :pi
                    """
                ),
                {"pi": str(payment_intent_id)},
            )
        ).mappings().first()

    if not payment_row:
        order_row = (
            await session.execute(
                text(
                    """
                    SELECT id, store_id FROM tcg_judge.shop_orders
                    WHERE stripe_payment_intent_id = :pi
                    LIMIT 1
                    """
                ),
                {"pi": str(payment_intent_id or "")},
            )
        ).mappings().first()
        if order_row:
            payment_id = await upsert_payment_for_order(
                session, shop_order_id=str(order_row["id"]), correlation_id=cid
            )
            payment_row = (
                await session.execute(
                    text(
                        "SELECT id, shop_order_id, store_id, status "
                        "FROM tcg_judge.payments WHERE id = CAST(:pid AS uuid)"
                    ),
                    {"pid": payment_id},
                )
            ).mappings().first()

    if not payment_row:
        logger.warning("chargeback_no_payment", dispute_id=dispute_id, pi=payment_intent_id)
        return None

    payment_id = str(payment_row["id"])
    shop_order_id = str(payment_row["shop_order_id"]) if payment_row.get("shop_order_id") else None
    store_id = str(payment_row["store_id"])
    amount_cents = int(dispute.get("amount") or 0)
    stripe_status = str(dispute.get("status") or "needs_response")
    cb_status = _DISPUTE_STATUS_MAP.get(stripe_status, "opened")

    evidence_due = None
    if dispute.get("evidence_details", {}).get("due_by"):
        evidence_due = datetime.fromtimestamp(
            int(dispute["evidence_details"]["due_by"]), tz=UTC
        )

    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.chargebacks (
                  payment_id, shop_order_id, store_id, stripe_dispute_id,
                  status, amount_cents, reason, evidence_due_by, metadata
                ) VALUES (
                  CAST(:pid AS uuid), CAST(:oid AS uuid), CAST(:sid AS uuid), :did,
                  :status, :amt, :reason, :due, CAST(:meta AS jsonb)
                )
                RETURNING id
                """
            ),
            {
                "pid": payment_id,
                "oid": shop_order_id,
                "sid": store_id,
                "did": dispute_id,
                "status": cb_status,
                "amt": max(amount_cents, 1),
                "reason": dispute.get("reason"),
                "due": evidence_due,
                "meta": json.dumps({"stripe_status": stripe_status, "charge_id": charge_id}),
            },
        )
    ).mappings().first()
    chargeback_id = str(row["id"])

    await mark_payment_chargeback(session, payment_id=payment_id, correlation_id=cid)

    if shop_order_id:
        await session.execute(
            text(
                """
                UPDATE tcg_judge.shop_orders
                SET status = 'disputed', updated_at = NOW()
                WHERE id = CAST(:oid AS uuid)
                """
            ),
            {"oid": shop_order_id},
        )

    await post_chargeback_reserve_entries(
        session,
        chargeback_id=chargeback_id,
        amount_cents=max(amount_cents, 1),
        correlation_id=cid,
    )

    await emit_outbox_event(
        session,
        event_type="ChargebackOpened",
        aggregate_type="Chargeback",
        aggregate_id=chargeback_id,
        payload={"payment_id": payment_id, "dispute_id": dispute_id},
        correlation_id=cid,
    )

    await emit_outbox_event(
        session,
        event_type="SettlementBlocked",
        aggregate_type="Settlement",
        aggregate_id=payment_id,
        payload={"reason": "chargeback", "chargeback_id": chargeback_id},
        correlation_id=cid,
    )

    logger.info("chargeback_opened", chargeback_id=chargeback_id, payment_id=payment_id)
    return chargeback_id


async def _update_chargeback_from_dispute(
    session: AsyncSession,
    chargeback_id: str,
    dispute: dict[str, Any],
    *,
    correlation_id: str,
) -> str:
    stripe_status = str(dispute.get("status") or "")
    cb_status = _DISPUTE_STATUS_MAP.get(stripe_status, "under_review")
    resolved_at = None
    if cb_status in ("won", "lost", "closed"):
        resolved_at = datetime.now(UTC)

    await session.execute(
        text(
            """
            UPDATE tcg_judge.chargebacks
            SET status = :status,
                resolved_at = COALESCE(:resolved, resolved_at),
                metadata = metadata || CAST(:meta AS jsonb),
                updated_at = NOW()
            WHERE id = CAST(:cid AS uuid)
            """
        ),
        {
            "cid": chargeback_id,
            "status": cb_status,
            "resolved": resolved_at,
            "meta": json.dumps({"stripe_status": stripe_status}),
        },
    )
    return chargeback_id


async def process_chargeback_job(
    session: AsyncSession,
    *,
    payment_id: str,
    correlation_id: str | None = None,
) -> dict[str, Any]:
    """Job chargeback.process — bloqueia settlement pendente do pagamento."""
    _ = correlation_id  # reserved for future tracing
    await session.execute(
        text(
            """
            UPDATE tcg_judge.settlements s
            SET status = 'Blocked',
                blocked_reason = 'chargeback',
                updated_at = NOW()
            FROM tcg_judge.settlement_items si
            WHERE si.settlement_id = s.id
              AND si.payment_id = CAST(:pid AS uuid)
              AND s.status IN ('Pending', 'Processing')
            """
        ),
        {"pid": payment_id},
    )
    return {"payment_id": payment_id, "blocked": True}
