"""Pagamentos de inscrição em torneios."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import stripe
from app.core.config import get_settings
from app.judge.stripe_service import stripe_enabled

PLATFORM_FEE_PERCENT = 5


async def get_tournament_fee(session: AsyncSession, tournament_id: str) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                SELECT id, name, entry_fee_cents, entry_fee_currency, created_by
                FROM tcg_judge.tournaments WHERE id = :id
                """
            ),
            {"id": tournament_id},
        )
    ).mappings().first()
    return dict(row) if row else {}


async def create_payment_intent(
    session: AsyncSession,
    tournament_id: str,
    player_id: str,
) -> dict[str, Any]:
    if not stripe_enabled(get_settings()):
        raise HTTPException(503, "Pagamentos indisponíveis")

    t = await get_tournament_fee(session, tournament_id)
    if not t:
        raise HTTPException(404, "Torneio não encontrado")
    amount = int(t.get("entry_fee_cents") or 0)
    if amount <= 0:
        return {"status": "free", "amount_cents": 0}

    platform_fee = int(amount * PLATFORM_FEE_PERCENT / 100)
    organizer_receives = amount - platform_fee
    currency = (t.get("entry_fee_currency") or "brl").lower()

    stripe.api_key = get_settings().stripe_secret_key
    intent = stripe.PaymentIntent.create(
        amount=amount + platform_fee,
        currency=currency,
        metadata={
            "tournament_id": tournament_id,
            "player_id": player_id,
            "type": "tournament_entry",
        },
        automatic_payment_methods={"enabled": True},
    )

    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.tournament_payments (
              tournament_id, player_id, amount_cents, platform_fee_cents,
              organizer_receives_cents, currency, gateway_payment_id, status
            ) VALUES (
              :tid, :pid, :amt, :fee, :org, :cur, :gid, 'pending'
            )
            ON CONFLICT (tournament_id, player_id) DO UPDATE SET
              gateway_payment_id = EXCLUDED.gateway_payment_id,
              status = 'pending'
            """
        ),
        {
            "tid": tournament_id,
            "pid": player_id,
            "amt": amount,
            "fee": platform_fee,
            "org": organizer_receives,
            "cur": currency.upper(),
            "gid": intent.id,
        },
    )
    await session.commit()
    return {
        "clientSecret": intent.client_secret,
        "paymentIntentId": intent.id,
        "amountCents": amount + platform_fee,
        "platformFeeCents": platform_fee,
        "currency": currency.upper(),
    }


async def confirm_payment(session: AsyncSession, payment_intent_id: str) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.tournament_payments SET
                  status = 'paid', paid_at = NOW()
                WHERE gateway_payment_id = :gid AND status = 'pending'
                RETURNING *
                """
            ),
            {"gid": payment_intent_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Pagamento não encontrado")
    await session.commit()
    return dict(row)


async def refund_payment(
    session: AsyncSession,
    tournament_id: str,
    player_id: str,
    *,
    tournament_starts_at: datetime | None,
) -> dict[str, Any]:
    if not stripe_enabled(get_settings()):
        raise HTTPException(503, "Pagamentos indisponíveis")

    row = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.tournament_payments
                WHERE tournament_id = :tid AND player_id = :pid AND status = 'paid'
                """
            ),
            {"tid": tournament_id, "pid": player_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Pagamento não encontrado")

    refund_percent = 100
    if tournament_starts_at:
        hours = (tournament_starts_at - datetime.now(UTC)).total_seconds() / 3600
        if hours < 24:
            refund_percent = 50

    amount = int(row["amount_cents"]) + int(row["platform_fee_cents"])
    refund_amount = int(amount * refund_percent / 100)

    if row.get("gateway_payment_id"):
        stripe.api_key = get_settings().stripe_secret_key
        stripe.Refund.create(
            payment_intent=row["gateway_payment_id"],
            amount=refund_amount,
        )

    status = "refunded" if refund_percent == 100 else "partial_refund"
    await session.execute(
        text(
            """
            UPDATE tcg_judge.tournament_payments SET
              status = :st, refunded_at = NOW(), refund_percent = :pct
            WHERE id = :id
            """
        ),
        {"st": status, "pct": refund_percent, "id": row["id"]},
    )
    await session.commit()
    return {"status": status, "refundPercent": refund_percent, "refundAmountCents": refund_amount}
