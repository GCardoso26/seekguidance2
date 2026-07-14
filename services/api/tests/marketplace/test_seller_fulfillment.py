"""Testes da state machine Fulfillment (WF-006)."""

import pytest
from app.marketplace.seller_fulfillment import _TRANSITIONS, _validate_transition
from fastapi import HTTPException


def test_pending_to_picking_allowed() -> None:
    _validate_transition("Pending", "Picking")


def test_completed_to_picking_forbidden() -> None:
    with pytest.raises(HTTPException) as exc:
        _validate_transition("Completed", "Picking")
    assert exc.value.status_code == 409


def test_shipped_to_in_transit_allowed() -> None:
    _validate_transition("Shipped", "InTransit")


def test_delivered_to_completed_allowed() -> None:
    _validate_transition("Delivered", "Completed")


def test_all_documented_happy_path() -> None:
    path = [
        ("Pending", "Picking"),
        ("Picking", "Picked"),
        ("Picked", "Packing"),
        ("Packing", "Packed"),
        ("Packed", "ReadyToShip"),
        ("ReadyToShip", "Shipped"),
        ("Shipped", "InTransit"),
        ("InTransit", "Delivered"),
        ("Delivered", "Completed"),
    ]
    for current, target in path:
        assert target in _TRANSITIONS[current], f"{current} -> {target}"


def test_forbidden_transitions_from_docs() -> None:
    forbidden = [
        ("Completed", "Picking"),
        ("Packed", "Pending"),
        ("Delivered", "Packing"),
        ("Lost", "Delivered"),
        ("Returned", "Delivered"),
    ]
    for current, target in forbidden:
        with pytest.raises(HTTPException):
            _validate_transition(current, target)
