"""Ledger balance rules (no DB)."""

from __future__ import annotations

import pytest
from app.financial_platform.domain import JournalLine
from app.financial_platform.security import assert_balanced
from fastapi import HTTPException


def test_balanced_ok() -> None:
    assert_balanced([(100, 0), (0, 100)])


def test_unbalanced_raises() -> None:
    with pytest.raises(HTTPException) as exc:
        assert_balanced([(100, 0), (0, 50)])
    assert exc.value.status_code == 400


def test_journal_line_shape() -> None:
    ln = JournalLine(account_code="a", debit_cents=10)
    assert ln.credit_cents == 0
