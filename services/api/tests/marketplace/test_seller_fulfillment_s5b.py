"""Testes Sprint 5b — bulk, webhook idempotência, Melhor Envio mapping."""

import pytest

from app.marketplace.seller_fulfillment import (
    _MELHOR_EVENT_TO_FULFILLMENT,
    _MELHOR_EVENT_TO_SHIPMENT_STATUS,
    _validate_transition,
)


def test_melhor_envio_status_mapping_posted() -> None:
    assert _MELHOR_EVENT_TO_SHIPMENT_STATUS["posted"] == "Posted"
    assert _MELHOR_EVENT_TO_FULFILLMENT["posted"] == "Shipped"


def test_melhor_envio_status_mapping_delivered() -> None:
    assert _MELHOR_EVENT_TO_SHIPMENT_STATUS["delivered"] == "Delivered"
    assert _MELHOR_EVENT_TO_FULFILLMENT["delivered"] == "Delivered"


def test_shipped_to_in_transit_via_webhook_path() -> None:
    _validate_transition("Shipped", "InTransit")


def test_bulk_command_constants() -> None:
    from app.marketplace.seller_fulfillment import _COMMAND_TO_STATUS

    assert _COMMAND_TO_STATUS["start_picking"] == "Picking"
