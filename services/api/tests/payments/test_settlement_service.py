"""Testes Settlement batch."""

from app.payments.settlement_service import _SETTLEMENT_TRANSITIONS


def test_settlement_pending_to_processing() -> None:
    assert "Processing" in _SETTLEMENT_TRANSITIONS["Pending"]


def test_settlement_released_to_reconciled() -> None:
    assert "Reconciled" in _SETTLEMENT_TRANSITIONS["Released"]


def test_settlement_reconciled_terminal() -> None:
    assert _SETTLEMENT_TRANSITIONS["Reconciled"] == set()
