"""Compra protegida (escrow) — retenção de fundos até confirmação."""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from typing import Any

import structlog
from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)

ESCROW_FEE_RATE = 0.03
PAYMENT_HOURS = 24
SHIPPING_HOURS = 48
CONFIRMATION_HOURS = 72
AUTO_RELEASE_DAYS = 7


def calculate_escrow_fees(amount_cents: int, shipping_cents: int = 0) -> dict[str, int]:
    escrow_fee_cents = round(amount_cents * ESCROW_FEE_RATE)
    seller_release_cents = max(0, amount_cents + shipping_cents - escrow_fee_cents)
    return {
        "amount_cents": amount_cents,
        "shipping_cents": shipping_cents,
        "escrow_fee_cents": escrow_fee_cents,
        "total_cents": amount_cents + shipping_cents + escrow_fee_cents,
        "seller_release_cents": seller_release_cents,
    }


def _deadlines(from_dt: datetime | None = None) -> dict[str, datetime]:
    base = from_dt or datetime.now(UTC)
    return {
        "payment_deadline": base + timedelta(hours=PAYMENT_HOURS),
        "shipping_deadline": base + timedelta(hours=SHIPPING_HOURS),
        "confirmation_deadline": base + timedelta(hours=CONFIRMATION_HOURS),
        "auto_release_at": base + timedelta(days=AUTO_RELEASE_DAYS),
    }


async def create_escrow_for_order(
    session: AsyncSession,
    *,
    shop_order_id: str,
    buyer_id: str,
    seller_id: str,
    amount_cents: int,
    shipping_cents: int = 0,
    payment_method: str,
) -> str:
    fees = calculate_escrow_fees(amount_cents, shipping_cents)
    deadlines = _deadlines()

    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.escrow_transactions (
                  shop_order_id, buyer_id, seller_id,
                  amount_cents, shipping_cents, escrow_fee_cents, total_cents,
                  status, payment_method,
                  payment_deadline, shipping_deadline, confirmation_deadline, auto_release_at,
                  status_history
                ) VALUES (
                  :oid, :buyer, :seller,
                  :amount, :shipping, :fee, :total,
                  'pending_payment', :pm,
                  :pay_dl, :ship_dl, :conf_dl, :auto_rel,
                  CAST(:history AS jsonb)
                )
                RETURNING id
                """
            ),
            {
                "oid": shop_order_id,
                "buyer": buyer_id,
                "seller": seller_id,
                "amount": fees["amount_cents"],
                "shipping": fees["shipping_cents"],
                "fee": fees["escrow_fee_cents"],
                "total": fees["total_cents"],
                "pm": payment_method,
                **{
                    "pay_dl": deadlines["payment_deadline"],
                    "ship_dl": deadlines["shipping_deadline"],
                    "conf_dl": deadlines["confirmation_deadline"],
                    "auto_rel": deadlines["auto_release_at"],
                },
                "history": json.dumps(
                    [{"to": "pending_payment", "at": datetime.now(UTC).isoformat(), "note": "created"}]
                ),
            },
        )
    ).mappings().first()
    if not row:
        raise HTTPException(500, "Falha ao criar escrow")
    return str(row["id"])


async def get_escrow_by_order(session: AsyncSession, order_id: str) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text("SELECT * FROM tcg_judge.escrow_transactions WHERE shop_order_id = :oid LIMIT 1"),
            {"oid": order_id},
        )
    ).mappings().first()
    return dict(row) if row else None


async def _upsert_pending_balance(session: AsyncSession, seller_id: str, delta_cents: int) -> None:
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.escrow_balances (user_id, pending_cents)
            VALUES (:uid, GREATEST(0, :delta))
            ON CONFLICT (user_id) DO UPDATE
            SET pending_cents = tcg_judge.escrow_balances.pending_cents + EXCLUDED.pending_cents,
                updated_at = NOW()
            """
        ),
        {"uid": seller_id, "delta": delta_cents},
    )


async def _move_pending_to_available(session: AsyncSession, seller_id: str, amount_cents: int) -> None:
    await session.execute(
        text(
            """
            UPDATE tcg_judge.escrow_balances
            SET pending_cents = GREATEST(0, pending_cents - :amt),
                available_cents = available_cents + :amt,
                total_earned_cents = total_earned_cents + :amt,
                updated_at = NOW()
            WHERE user_id = :uid
            """
        ),
        {"uid": seller_id, "amt": amount_cents},
    )


async def on_payment_received(
    session: AsyncSession,
    order_id: str,
    *,
    payment_intent_id: str | None = None,
    pix_txid: str | None = None,
) -> dict[str, Any] | None:
    escrow = await get_escrow_by_order(session, order_id)
    if not escrow:
        return None
    if escrow["status"] != "pending_payment":
        return dict(escrow)

    fees = calculate_escrow_fees(int(escrow["amount_cents"]), int(escrow["shipping_cents"]))
    deadlines = _deadlines()

    await session.execute(
        text(
            """
            UPDATE tcg_judge.escrow_transactions
            SET status = 'payment_received',
                payment_intent_id = COALESCE(:pi, payment_intent_id),
                pix_txid = COALESCE(:txid, pix_txid),
                shipping_deadline = :ship_dl,
                confirmation_deadline = :conf_dl,
                auto_release_at = :auto_rel,
                updated_at = NOW()
            WHERE id = :id
            """
        ),
        {
            "id": str(escrow["id"]),
            "pi": payment_intent_id,
            "txid": pix_txid,
            "ship_dl": deadlines["shipping_deadline"],
            "conf_dl": deadlines["confirmation_deadline"],
            "auto_rel": deadlines["auto_release_at"],
        },
    )
    await _upsert_pending_balance(session, str(escrow["seller_id"]), fees["seller_release_cents"])

    await session.execute(
        text(
            """
            UPDATE tcg_judge.shop_orders
            SET status = 'processing', paid_at = NOW(), updated_at = NOW()
            WHERE id = :id AND status = 'pending'
            """
        ),
        {"id": order_id},
    )
    return await get_escrow_by_order(session, order_id)


async def sync_escrow_with_order_status(session: AsyncSession, order_id: str, order_status: str) -> None:
    escrow = await get_escrow_by_order(session, order_id)
    if not escrow:
        return

    mapping = {
        "shipped": "shipped",
        "delivered": "delivered",
    }
    target = mapping.get(order_status)
    if not target or escrow["status"] in {"released_to_seller", "refunded_to_buyer", "cancelled", "disputed"}:
        return

    current = str(escrow["status"])
    allowed = {
        "payment_received": {"shipped"},
        "shipped": {"delivered"},
        "delivered": set(),
    }
    if target not in allowed.get(current, set()):
        return

    await session.execute(
        text(
            """
            UPDATE tcg_judge.escrow_transactions
            SET status = CAST(:status AS tcg_judge.escrow_status), updated_at = NOW()
            WHERE id = :id
            """
        ),
        {"id": str(escrow["id"]), "status": target},
    )


async def confirm_delivery(
    session: AsyncSession,
    escrow_id: str,
    buyer_id: str,
) -> dict[str, Any]:
    escrow = (
        await session.execute(
            text("SELECT * FROM tcg_judge.escrow_transactions WHERE id = :id"),
            {"id": escrow_id},
        )
    ).mappings().first()
    if not escrow:
        raise HTTPException(404, "Escrow não encontrado")
    if str(escrow["buyer_id"]) != buyer_id:
        raise HTTPException(403, "Apenas o comprador pode confirmar")
    if escrow["status"] not in {"shipped", "delivered"}:
        raise HTTPException(400, "Pedido ainda não foi enviado")

    result = await release_to_seller(session, str(escrow["id"]), note="buyer_confirmed")
    await session.commit()
    return result


async def release_to_seller(
    session: AsyncSession,
    escrow_id: str,
    *,
    note: str = "auto_release",
) -> dict[str, Any]:
    escrow = (
        await session.execute(
            text("SELECT * FROM tcg_judge.escrow_transactions WHERE id = :id FOR UPDATE"),
            {"id": escrow_id},
        )
    ).mappings().first()
    if not escrow:
        raise HTTPException(404, "Escrow não encontrado")
    if escrow["status"] in {"released_to_seller", "refunded_to_buyer", "cancelled"}:
        return dict(escrow)

    fees = calculate_escrow_fees(int(escrow["amount_cents"]), int(escrow["shipping_cents"]))
    seller_id = str(escrow["seller_id"])
    order_id = str(escrow["shop_order_id"])

    await session.execute(
        text(
            """
            UPDATE tcg_judge.escrow_transactions
            SET status = 'released_to_seller', updated_at = NOW()
            WHERE id = :id
            """
        ),
        {"id": escrow_id},
    )
    await _move_pending_to_available(session, seller_id, fees["seller_release_cents"])

    await session.execute(
        text(
            """
            UPDATE tcg_judge.shop_orders
            SET status = 'delivered', delivered_at = COALESCE(delivered_at, NOW()), updated_at = NOW()
            WHERE id = :id
            """
        ),
        {"id": order_id},
    )
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.shop_order_status_history (order_id, status, note)
            VALUES (:oid, 'delivered', :note)
            """
        ),
        {"oid": order_id, "note": note},
    )

    row = (
        await session.execute(
            text("SELECT * FROM tcg_judge.escrow_transactions WHERE id = :id"),
            {"id": escrow_id},
        )
    ).mappings().first()
    return dict(row) if row else {}


async def open_dispute(
    session: AsyncSession,
    escrow_id: str,
    buyer_id: str,
    *,
    reason: str,
    evidence: dict[str, Any] | None = None,
) -> dict[str, Any]:
    escrow = (
        await session.execute(
            text("SELECT * FROM tcg_judge.escrow_transactions WHERE id = :id"),
            {"id": escrow_id},
        )
    ).mappings().first()
    if not escrow:
        raise HTTPException(404, "Escrow não encontrado")
    if str(escrow["buyer_id"]) != buyer_id:
        raise HTTPException(403, "Apenas o comprador pode abrir disputa")
    if escrow["status"] not in {"payment_received", "shipped", "delivered"}:
        raise HTTPException(400, "Disputa não disponível para este status")

    await session.execute(
        text(
            """
            UPDATE tcg_judge.escrow_transactions
            SET status = 'disputed',
                dispute_reason = :reason,
                dispute_evidence = CAST(:evidence AS jsonb),
                updated_at = NOW()
            WHERE id = :id
            """
        ),
        {
            "id": escrow_id,
            "reason": reason[:2000],
            "evidence": json.dumps(evidence or {}),
        },
    )
    await session.commit()
    updated = (
        await session.execute(
            text("SELECT * FROM tcg_judge.escrow_transactions WHERE id = :id"),
            {"id": escrow_id},
        )
    ).mappings().first()
    return dict(updated) if updated else {}


async def run_auto_actions(session: AsyncSession) -> dict[str, Any]:
    now = datetime.now(UTC)
    rows = (
        await session.execute(
            text(
                """
                SELECT id, status, payment_deadline, shipping_deadline,
                       confirmation_deadline, auto_release_at
                FROM tcg_judge.escrow_transactions
                WHERE status IN (
                  'pending_payment', 'payment_received', 'shipped', 'delivered'
                )
                """
            )
        )
    ).mappings().all()

    cancelled = 0
    released = 0

    for row in rows:
        escrow_id = str(row["id"])
        status = str(row["status"])

        if status == "pending_payment" and row["payment_deadline"] and row["payment_deadline"] < now:
            await session.execute(
                text(
                    """
                    UPDATE tcg_judge.escrow_transactions
                    SET status = 'cancelled', updated_at = NOW()
                    WHERE id = :id
                    """
                ),
                {"id": escrow_id},
            )
            cancelled += 1
            continue

        if status in {"shipped", "delivered"} and row["auto_release_at"] and row["auto_release_at"] < now:
            try:
                await release_to_seller(session, escrow_id, note="auto_release_cron")
                await session.commit()
                released += 1
            except HTTPException:
                logger.warning("escrow_auto_release_skipped", escrow_id=escrow_id)

    if cancelled and released == 0:
        await session.commit()

    return {"cancelled": cancelled, "auto_released": released, "checked": len(rows)}


async def order_has_escrow(session: AsyncSession, order_id: str) -> bool:
    row = (
        await session.execute(
            text("SELECT 1 FROM tcg_judge.escrow_transactions WHERE shop_order_id = :oid LIMIT 1"),
            {"oid": order_id},
        )
    ).first()
    return row is not None
