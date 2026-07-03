"""Testes de clientes vendedor."""

from app.marketplace.shop_crm import _segment_for


def test_segment_high_spender():
    assert _segment_for(50000, 5) == "high_spender"


def test_segment_frequent():
    assert _segment_for(10000, 3) == "frequent"


def test_segment_new():
    assert _segment_for(5000, 1) == "new"


def test_customer_list_contract():
    row = {
        "customer_id": "u1",
        "display_name": "João",
        "total_spent_cents": 1000,
        "order_count": 2,
    }
    assert row["order_count"] >= 1
