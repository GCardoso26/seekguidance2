"""Inventory ticket contract adapter — does not mutate Inventory package."""

from __future__ import annotations

from typing import Any

from app.tournament_platform.domain import EventTicket


def ticket_inventory_contract(ticket: EventTicket | dict[str, Any]) -> dict[str, Any]:
    """Map event ticket to InventoryType.EVENT policy contract.

    EVENT allows online (PIX/Stripe) and counter; seller/checkout chooses path.
    """
    data = ticket.to_dict() if isinstance(ticket, EventTicket) else dict(ticket)
    online_required = bool(data.get("online_payment_required", False))
    counter_forbidden = bool(data.get("counter_payment_forbidden", False))
    allowed = ["pix", "stripe"]
    if not counter_forbidden:
        allowed.append("counter")
    forbidden = [] if not counter_forbidden else ["counter"]
    return {
        "inventory_type": "EVENT",
        "sku_ref": data.get("store_product_id"),
        "price_cents": data.get("price_cents", 0),
        "quantity": data.get("quantity", 0),
        "capacity": data.get("capacity"),
        "availability": data.get("availability"),
        "payment_policy": {
            "online_required": online_required,
            "counter_forbidden": counter_forbidden,
            "allowed_methods": allowed,
            "forbidden_methods": forbidden,
        },
        "require_checkin": bool(data.get("require_checkin", True)),
        "checkout_wired": True,
    }


def validate_ticket_policy(ticket: EventTicket | dict[str, Any]) -> list[str]:
    """Return list of policy violations (empty = ok)."""
    data = ticket.to_dict() if isinstance(ticket, EventTicket) else dict(ticket)
    errors: list[str] = []
    if int(data.get("price_cents") or 0) < 0:
        errors.append("price_cents must be >= 0")
    return errors
