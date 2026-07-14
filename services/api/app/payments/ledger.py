"""Double-entry ledger helpers — Sprint 6."""

from __future__ import annotations

import uuid

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)


async def _post_pair(
    session: AsyncSession,
    *,
    debit_account: str,
    credit_account: str,
    amount_cents: int,
    reference_type: str,
    reference_id: str,
    description: str,
    correlation_id: str,
    currency: str = "BRL",
) -> None:
    if amount_cents <= 0:
        return
    group_id = str(uuid.uuid4())
    base = {
        "group": group_id,
        "amt": amount_cents,
        "cur": currency,
        "ref_type": reference_type,
        "ref_id": reference_id,
        "desc": description,
        "cid": correlation_id,
    }
    for side, account in (("debit", debit_account), ("credit", credit_account)):
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.ledger_entries
                  (entry_group_id, account, side, amount_cents, currency,
                   reference_type, reference_id, description, correlation_id)
                VALUES (
                  CAST(:group AS uuid), :acct, :side, :amt, :cur,
                  :ref_type, CAST(:ref_id AS uuid), :desc, CAST(:cid AS uuid)
                )
                """
            ),
            {**base, "acct": account, "side": side},
        )


async def post_payment_capture_entries(
    session: AsyncSession,
    *,
    payment_id: str,
    correlation_id: str,
) -> None:
    row = (
        await session.execute(
            text(
                """
                SELECT amount_cents, platform_fee_cents, store_amount_cents, use_escrow
                FROM tcg_judge.payments WHERE id = CAST(:pid AS uuid)
                """
            ),
            {"pid": payment_id},
        )
    ).mappings().first()
    if not row:
        return

    total = int(row["amount_cents"])
    fee = int(row["platform_fee_cents"] or 0)
    store_amt = int(row["store_amount_cents"] or 0)
    use_escrow = bool(row["use_escrow"])

    await _post_pair(
        session,
        debit_account="stripe_clearing",
        credit_account="platform_revenue" if not use_escrow else "escrow_hold",
        amount_cents=total,
        reference_type="payment",
        reference_id=payment_id,
        description="Payment capture — gross",
        correlation_id=correlation_id,
    )
    if fee > 0:
        await _post_pair(
            session,
            debit_account="platform_revenue" if not use_escrow else "escrow_hold",
            credit_account="platform_revenue",
            amount_cents=fee,
            reference_type="payment",
            reference_id=payment_id,
            description="Platform fee",
            correlation_id=correlation_id,
        )
    if store_amt > 0 and not use_escrow:
        await _post_pair(
            session,
            debit_account="stripe_clearing",
            credit_account="seller_payable",
            amount_cents=store_amt,
            reference_type="payment",
            reference_id=payment_id,
            description="Seller payable",
            correlation_id=correlation_id,
        )


async def post_settlement_release_entries(
    session: AsyncSession,
    *,
    settlement_id: str,
    amount_cents: int,
    correlation_id: str,
) -> None:
    await _post_pair(
        session,
        debit_account="seller_payable",
        credit_account="settlement_payable",
        amount_cents=amount_cents,
        reference_type="settlement",
        reference_id=settlement_id,
        description="Settlement batch release",
        correlation_id=correlation_id,
    )


async def post_chargeback_reserve_entries(
    session: AsyncSession,
    *,
    chargeback_id: str,
    amount_cents: int,
    correlation_id: str,
) -> None:
    await _post_pair(
        session,
        debit_account="chargeback_reserve",
        credit_account="seller_payable",
        amount_cents=amount_cents,
        reference_type="chargeback",
        reference_id=chargeback_id,
        description="Chargeback reserve hold",
        correlation_id=correlation_id,
    )
