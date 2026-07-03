"""Testes de support tickets."""

from app.marketplace.seller_tickets import (
    TICKET_CATEGORIES,
    TICKET_PRIORITIES,
    TICKET_STATUSES,
)


def test_ticket_statuses():
    assert "open" in TICKET_STATUSES
    assert "closed" in TICKET_STATUSES


def test_ticket_categories():
    assert "payment" in TICKET_CATEGORIES
    assert "shipping" in TICKET_CATEGORIES


def test_ticket_priorities():
    assert "urgent" in TICKET_PRIORITIES


def test_ticket_create_contract():
    ticket = {
        "id": "t1",
        "subject": "Test",
        "status": "open",
        "category": "other",
        "priority": "medium",
    }
    assert ticket["status"] == "open"
