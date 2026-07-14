"""Testes da state machine Payment (WF-004)."""

import pytest
from app.payments.payment_aggregate import _TRANSITIONS, _validate_transition
from fastapi import HTTPException


def test_created_to_pending_authorization() -> None:
    _validate_transition("Created", "PendingAuthorization")


def test_approved_to_chargeback_allowed() -> None:
    _validate_transition("Approved", "Chargeback")


def test_refunded_to_approved_forbidden() -> None:
    with pytest.raises(HTTPException) as exc:
        _validate_transition("Refunded", "Approved")
    assert exc.value.status_code == 409


def test_happy_path_capture() -> None:
    path = [
        ("Created", "PendingAuthorization"),
        ("PendingAuthorization", "Authorized"),
        ("Authorized", "Captured"),
        ("Captured", "Approved"),
    ]
    for current, target in path:
        assert target in _TRANSITIONS[current]


def test_forbidden_from_docs() -> None:
    forbidden = [
        ("Approved", "Created"),
        ("Refunded", "Approved"),
        ("Chargeback", "Authorized"),
        ("Expired", "Approved"),
    ]
    for current, target in forbidden:
        with pytest.raises(HTTPException):
            _validate_transition(current, target)
