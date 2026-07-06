"""Payment aggregate — state machine WF-004."""

from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime
from typing import Any, Literal

import structlog
from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.platform.jobs import (
    JOB_CHARGE_BACK_PROCESS,
    JOB_PAYMENT_RECONCILE,
    emit_outbox_event,
    enqueue_job,
)

logger = structlog.get_logger(__name__)

PaymentStatus = Literal[
    "Created",
    "PendingAuthorization",
    "Authorized",
    "Captured",
    "Approved",
    "Failed",
    "Expired",
    "Cancelled",
    "RefundPending",
    "Refunded",
    "Chargeback",
    "Disputed",
]

_TRANSITIONS: dict[str, set[str]] = {
    "Created": {"PendingAuthorization", "Cancelled", "Failed"},
    "PendingAuthorization": {"Authorized", "Failed", "Expired", "Cancelled"},
    "Authorized": {"Captured", "Failed", "Cancelled"},
    "Captured": {"Approved", "RefundPending", "Chargeback", "Disputed"},
    "Approved": {"RefundPending", "Chargeback", "Disputed"},
    "Failed": set(),
    "Expired": set(),
    "Cancelled": set(),
    "RefundPending": {"Refunded", "Approved"},
    "Refunded": set(),
    "Chargeback": {"Disputed", "Refunded"},
    "Disputed": {"Chargeback", "Approved", "Refunded"},
}

_STATUS_EVENTS: dict[str, str] = {
    "Captured": "PaymentCaptured",
    "Approved": "PaymentApproved",
    "Failed": "PaymentFailed",
    "Chargeback": "ChargebackOpened",
    "Disputed": "ChargebackOpened",
}


def _validate_transition(current: str, target: str) -> None:
    allowed = _TRANSITIONS.get(current, set())
    if target not in allowed:
        raise HTTPException(
            409,
            f"Transição de pagamento inválida: {current} → {target}",
        )


async def _append_history(
    session: AsyncSession,
    *,
    payment_id: str,
    from_status: str | None,
    to_status: str,
    event_type: str | None,
    correlation_id: str,
    actor_id: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.payment_status_history
              (payment_id, from_status, to_status, actor_id, event_type, correlation_id, metadata)
            VALUES (
              CAST(:pid AS uuid), :from_s, :to_s, :actor, :evt,
              CAST(:cid AS uuid), CAST(:meta AS jsonb)
            )
            """
        ),
        {
            "pid": payment_id,
            "from_s": from_status,
            "to_s": to_status,
            "actor": actor_id,
            "evt": event_type,
            "cid": correlation_id,
            "meta": json.dumps(metadata or {}),
        },
    )


async def _transition(
    session: AsyncSession,
    payment_id: str,
    *,
    current: str,
    target: str,
    correlation_id: str,
    actor_id: str | None = None,
    extra_sets: str = "",
    extra_params: dict[str, Any] | None = None,
) -> None:
    _validate_transition(current, target)
    params: dict[str, Any] = {
        "pid": payment_id,
        "status": target,
        **(extra_params or {}),
    }
    await session.execute(
        text(
            f"""
            UPDATE tcg_judge.payments
            SET status = :status, updated_at = NOW()
            {extra_sets}
            WHERE id = CAST(:pid AS uuid) AND status = :current
            """
        ),
        {**params, "current": current},
    )
    event_type = _STATUS_EVENTS.get(target)
    await _append_history(
        session,
        payment_id=payment_id,
        from_status=current,
        to_status=target,
        event_type=event_type,
        correlation_id=correlation_id,
        actor_id=actor_id,
    )
    if event_type:
        await emit_outbox_event(
            session,
            event_type=event_type,
            aggregate_type="Payment",
            aggregate_id=payment_id,
            payload={"from_status": current, "to_status": target},
            correlation_id=correlation_id,
        )


async def upsert_payment_for_order(
    session: AsyncSession,
    *,
    shop_order_id: str,
    correlation_id: str | None = None,
) -> str:
    """Garante registro Payment para um pedido (idempotente)."""
    cid = correlation_id or str(uuid.uuid4())
    existing = (
        await session.execute(
            text("SELECT id FROM tcg_judge.payments WHERE shop_order_id = CAST(:oid AS uuid)"),
            {"oid": shop_order_id},
        )
    ).mappings().first()
    if existing:
        return str(existing["id"])

    order = (
        await session.execute(
            text(
                """
                SELECT id, store_id, buyer_id, total_cents, platform_fee_cents,
                       store_receives_cents, payment_method, use_escrow,
                       stripe_payment_intent_id, pix_txid, status
                FROM tcg_judge.shop_orders WHERE id = CAST(:oid AS uuid)
                """
            ),
            {"oid": shop_order_id},
        )
    ).mappings().first()
    if not order:
        raise HTTPException(404, "Pedido não encontrado")

    idem_key = f"payment-order-{shop_order_id}"
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.payments (
                  shop_order_id, store_id, buyer_id, status, payment_method,
                  amount_cents, platform_fee_cents, store_amount_cents,
                  stripe_payment_intent_id, pix_txid, use_escrow,
                  correlation_id, idempotency_key
                ) VALUES (
                  CAST(:oid AS uuid), CAST(:sid AS uuid), :buyer, 'Created', :pm,
                  :amount, :fee, :store_amt,
                  :pi, :pix, :escrow,
                  CAST(:cid AS uuid), :idem
                )
                ON CONFLICT (idempotency_key) DO NOTHING
                RETURNING id
                """
            ),
            {
                "oid": shop_order_id,
                "sid": str(order["store_id"]),
                "buyer": str(order["buyer_id"]),
                "pm": str(order.get("payment_method") or "stripe"),
                "amount": int(order["total_cents"]),
                "fee": int(order.get("platform_fee_cents") or 0),
                "store_amt": int(order.get("store_receives_cents") or 0),
                "pi": order.get("stripe_payment_intent_id"),
                "pix": order.get("pix_txid"),
                "escrow": bool(order.get("use_escrow")),
                "cid": cid,
                "idem": idem_key,
            },
        )
    ).mappings().first()
    if row:
        payment_id = str(row["id"])
        await _append_history(
            session,
            payment_id=payment_id,
            from_status=None,
            to_status="Created",
            event_type="PaymentCreated",
            correlation_id=cid,
        )
        return payment_id

    again = (
        await session.execute(
            text("SELECT id FROM tcg_judge.payments WHERE shop_order_id = CAST(:oid AS uuid)"),
            {"oid": shop_order_id},
        )
    ).mappings().first()
    return str(again["id"]) if again else ""


async def record_payment_captured(
    session: AsyncSession,
    *,
    shop_order_id: str,
    stripe_payment_intent_id: str | None = None,
    pix_txid: str | None = None,
    correlation_id: str | None = None,
) -> str:
    """Bridge pós-webhook: Created → Captured → Approved."""
    cid = correlation_id or str(uuid.uuid4())
    payment_id = await upsert_payment_for_order(session, shop_order_id=shop_order_id, correlation_id=cid)

    row = (
        await session.execute(
            text("SELECT id, status FROM tcg_judge.payments WHERE id = CAST(:pid AS uuid)"),
            {"pid": payment_id},
        )
    ).mappings().first()
    if not row:
        return payment_id

    current = str(row["status"])
    if current in ("Approved", "Refunded", "Chargeback"):
        return payment_id

    # Atualiza referências gateway
    await session.execute(
        text(
            """
            UPDATE tcg_judge.payments
            SET stripe_payment_intent_id = COALESCE(:pi, stripe_payment_intent_id),
                pix_txid = COALESCE(:pix, pix_txid),
                updated_at = NOW()
            WHERE id = CAST(:pid AS uuid)
            """
        ),
        {"pid": payment_id, "pi": stripe_payment_intent_id, "pix": pix_txid},
    )

    if current == "Created":
        await _transition(
            session,
            payment_id,
            current="Created",
            target="PendingAuthorization",
            correlation_id=cid,
        )
        current = "PendingAuthorization"

    if current == "PendingAuthorization":
        await _transition(session, payment_id, current=current, target="Authorized", correlation_id=cid)
        current = "Authorized"

    if current == "Authorized":
        await _transition(
            session,
            payment_id,
            current=current,
            target="Captured",
            correlation_id=cid,
            extra_sets=", captured_at = NOW()",
        )
        current = "Captured"

    if current == "Captured":
        await _transition(
            session,
            payment_id,
            current=current,
            target="Approved",
            correlation_id=cid,
            extra_sets=", approved_at = NOW()",
        )

    from app.payments.ledger import post_payment_capture_entries

    await post_payment_capture_entries(session, payment_id=payment_id, correlation_id=cid)

    await enqueue_job(
        session,
        job_type=JOB_PAYMENT_RECONCILE,
        payload={"payment_id": payment_id},
        correlation_id=cid,
        priority=1,
    )

    order_row = (
        await session.execute(
            text("SELECT store_id FROM tcg_judge.shop_orders WHERE id = CAST(:oid AS uuid)"),
            {"oid": shop_order_id},
        )
    ).mappings().first()
    if order_row:
        try:
            from app.reputation.reputation_engine import enqueue_reputation_recalc

            await enqueue_reputation_recalc(
                session,
                store_id=str(order_row["store_id"]),
                event_type="OrderPaid",
                source_id=payment_id,
                correlation_id=cid,
            )
        except Exception as exc:
            logger.warning("reputation_enqueue_failed", order_id=shop_order_id, error=str(exc))

    return payment_id


async def record_payment_failed(
    session: AsyncSession,
    *,
    shop_order_id: str | None = None,
    stripe_payment_intent_id: str | None = None,
    reason: str | None = None,
    correlation_id: str | None = None,
) -> str | None:
    cid = correlation_id or str(uuid.uuid4())
    payment_row = None
    if shop_order_id:
        payment_id = await upsert_payment_for_order(session, shop_order_id=shop_order_id, correlation_id=cid)
        payment_row = (
            await session.execute(
                text("SELECT id, status FROM tcg_judge.payments WHERE id = CAST(:pid AS uuid)"),
                {"pid": payment_id},
            )
        ).mappings().first()
    elif stripe_payment_intent_id:
        payment_row = (
            await session.execute(
                text(
                    """
                    SELECT id, status FROM tcg_judge.payments
                    WHERE stripe_payment_intent_id = :pi
                    """
                ),
                {"pi": stripe_payment_intent_id},
            )
        ).mappings().first()

    if not payment_row:
        return None

    payment_id = str(payment_row["id"])
    current = str(payment_row["status"])
    if current in ("Failed", "Approved", "Refunded"):
        return payment_id

    if current == "Created":
        await _transition(session, payment_id, current=current, target="PendingAuthorization", correlation_id=cid)
        current = "PendingAuthorization"

    if current in ("PendingAuthorization", "Authorized"):
        await _transition(
            session,
            payment_id,
            current=current,
            target="Failed",
            correlation_id=cid,
            extra_sets=", failed_at = NOW()",
            extra_params={"reason": reason},
        )
        await emit_outbox_event(
            session,
            event_type="PaymentFailed",
            aggregate_type="Payment",
            aggregate_id=payment_id,
            payload={"reason": reason},
            correlation_id=cid,
        )
    return payment_id


async def mark_payment_chargeback(
    session: AsyncSession,
    *,
    payment_id: str,
    correlation_id: str,
    to_status: PaymentStatus = "Chargeback",
) -> None:
    row = (
        await session.execute(
            text("SELECT status FROM tcg_judge.payments WHERE id = CAST(:pid AS uuid)"),
            {"pid": payment_id},
        )
    ).mappings().first()
    if not row:
        return
    current = str(row["status"])
    if current in ("Chargeback", "Disputed", "Refunded"):
        return
    # Captured/Approved → Chargeback
    if current in ("Captured", "Approved"):
        await _transition(session, payment_id, current=current, target=to_status, correlation_id=correlation_id)
    elif current == "Chargeback" and to_status == "Disputed":
        await _transition(session, payment_id, current=current, target="Disputed", correlation_id=correlation_id)

    await enqueue_job(
        session,
        job_type=JOB_CHARGE_BACK_PROCESS,
        payload={"payment_id": payment_id},
        correlation_id=correlation_id,
        priority=2,
    )

    pay_row = (
        await session.execute(
            text("SELECT store_id FROM tcg_judge.payments WHERE id = CAST(:pid AS uuid)"),
            {"pid": payment_id},
        )
    ).mappings().first()
    if pay_row:
        try:
            from app.reputation.reputation_engine import enqueue_reputation_recalc

            await enqueue_reputation_recalc(
                session,
                store_id=str(pay_row["store_id"]),
                event_type="ChargebackOpened",
                source_id=payment_id,
                correlation_id=correlation_id,
            )
        except Exception as exc:
            logger.warning("reputation_chargeback_enqueue_failed", payment_id=payment_id, error=str(exc))


async def get_payment_audit_trail(
    session: AsyncSession,
    store_id: str,
    *,
    limit: int = 50,
    offset: int = 0,
) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT h.id, h.payment_id, h.from_status, h.to_status, h.event_type,
                       h.actor_id, h.correlation_id, h.metadata, h.created_at,
                       p.shop_order_id, p.amount_cents, p.payment_method
                FROM tcg_judge.payment_status_history h
                JOIN tcg_judge.payments p ON p.id = h.payment_id
                WHERE p.store_id = CAST(:sid AS uuid)
                ORDER BY h.created_at DESC
                LIMIT :lim OFFSET :off
                """
            ),
            {"sid": store_id, "lim": limit, "off": offset},
        )
    ).mappings().all()
    return [dict(r) for r in rows]
