"""FSM transitions."""

from __future__ import annotations

from app.financial_platform.domain.enums import (
    ChargebackStatus,
    EscrowStatus,
    PayoutStatus,
    RefundStatus,
)
from app.financial_platform.services.money_engines import (
    ChargebackService,
    EscrowService,
    PayoutService,
    RefundService,
)


def test_escrow_happy_path() -> None:
    svc = EscrowService(session=None)  # type: ignore[arg-type]
    assert svc.can_transition(EscrowStatus.HELD, EscrowStatus.RELEASED)
    assert not svc.can_transition(EscrowStatus.RELEASED, EscrowStatus.HELD)


def test_refund_path() -> None:
    svc = RefundService(session=None)  # type: ignore[arg-type]
    assert svc.can_transition(RefundStatus.REQUESTED, RefundStatus.REVIEW)
    assert svc.can_transition(RefundStatus.APPROVED, RefundStatus.EXECUTED)
    assert not svc.can_transition(RefundStatus.EXECUTED, RefundStatus.REQUESTED)


def test_payout_and_chargeback() -> None:
    p = PayoutService(session=None)  # type: ignore[arg-type]
    c = ChargebackService(session=None)  # type: ignore[arg-type]
    assert p.can_transition(PayoutStatus.PENDING, PayoutStatus.PROCESSING)
    assert c.can_transition(ChargebackStatus.RECEIVED, ChargebackStatus.ANALYSIS)
