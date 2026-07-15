"""Ticket inventory contract + policy."""

from __future__ import annotations

from app.tournament_platform.adapters.inventory_ticket import (
    ticket_inventory_contract,
    validate_ticket_policy,
)
from app.tournament_platform.domain import EventTicket


def test_contract_marks_event_inventory() -> None:
    t = EventTicket(id="1", store_event_id="e1", price_cents=5000, quantity=16)
    c = ticket_inventory_contract(t)
    assert c["inventory_type"] == "EVENT"
    assert c["checkout_wired"] is False
    assert "counter" in c["payment_policy"]["forbidden_methods"]


def test_policy_requires_online_and_forbids_counter() -> None:
    bad = EventTicket(
        id="1",
        store_event_id="e1",
        online_payment_required=False,
        counter_payment_forbidden=False,
    )
    errs = validate_ticket_policy(bad)
    assert any("online_payment" in e for e in errs)
    assert any("counter" in e for e in errs)


def test_valid_ticket_no_errors() -> None:
    t = EventTicket(id="1", store_event_id="e1")
    assert validate_ticket_policy(t) == []
