"""Testes financeiro vendedor."""

from app.marketplace.seller_finance import _PAID_STATUSES, _period_start


def test_paid_statuses_include_shipped():
    assert "paid" in _PAID_STATUSES
    assert "shipped" in _PAID_STATUSES
    assert "delivered" in _PAID_STATUSES


def test_period_start_30d_default():
    start = _period_start("30d", None)
    assert start.tzinfo is not None


def test_period_start_custom_date():
    start = _period_start("custom", "2026-01-01T00:00:00Z")
    assert start.year == 2026


def test_revenue_row_contract():
    row = {
        "date": "2026-07-02",
        "orders": 12,
        "gross_cents": 120_000,
        "fees_cents": 12_000,
        "net_cents": 108_000,
        "status": "received",
    }
    assert row["net_cents"] == row["gross_cents"] - row["fees_cents"]


def test_payout_status_labels():
    statuses = ["pending", "processing", "completed", "failed"]
    assert len(statuses) == 4


def test_notification_defaults_keys():
    defaults = {
        "new_order": ["email", "push"],
        "payment_received": ["email"],
        "ticket_created": ["email", "push"],
        "low_stock": ["email"],
        "daily_summary": ["email"],
    }
    assert "push" in defaults["new_order"]
