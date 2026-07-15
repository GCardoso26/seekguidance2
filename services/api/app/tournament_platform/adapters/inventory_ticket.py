"""Inventory ticket contract adapter — does not mutate Inventory package."""

from __future__ import annotations

from typing import Any

from app.tournament_platform.domain import EventTicket


def ticket_inventory_contract(ticket: EventTicket | dict[str, Any]) -> dict[str, Any]:
    """Map event ticket to InventoryType.EVENT policy contract.

    Checkout / inventory tables are NOT modified. This is a facade for
    Business Program 2 documentation + future wiring.
    """
    data = ticket.to_dict() if isinstance(ticket, EventTicket) else dict(ticket)
    return {
        "inventory_type": "EVENT",
        "sku_ref": data.get("store_product_id"),
        "price_cents": data.get("price_cents", 0),
        "quantity": data.get("quantity", 0),
        "capacity": data.get("capacity"),
        "availability": data.get("availability"),
        "payment_policy": {
            "online_required": bool(data.get("online_payment_required", True)),
            "counter_forbidden": bool(data.get("counter_payment_forbidden", True)),
            "allowed_methods": ["pix", "stripe"],
            "forbidden_methods": ["counter"],
        },
        "require_checkin": bool(data.get("require_checkin", True)),
        "checkout_wired": False,
    }


def validate_ticket_policy(ticket: EventTicket | dict[str, Any]) -> list[str]:
    """Return list of policy violations (empty = ok)."""
    data = ticket.to_dict() if isinstance(ticket, EventTicket) else dict(ticket)
    errors: list[str] = []
    if not data.get("online_payment_required", True):
        errors.append("online_payment_required must be true for EVENT tickets in BP2")
    if not data.get("counter_payment_forbidden", True):
        errors.append("counter_payment_forbidden must be true for EVENT tickets in BP2")
    if int(data.get("price_cents") or 0) < 0:
        errors.append("price_cents must be >= 0")
    return errors
