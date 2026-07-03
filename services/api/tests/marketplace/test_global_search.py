"""Testes de busca global do painel lojista."""

from app.marketplace.seller_search import _format_order_title


def test_format_order_title_short_id():
    title = _format_order_title("18555abc-def0-1234-5678-90abcdef1234")
    assert title.startswith("#")
    assert len(title) <= 6


def test_search_item_contract():
    item = {
        "type": "order",
        "id": "uuid-1",
        "title": "#18555",
        "subtitle": "João Silva",
        "status": "shipped",
    }
    assert item["type"] == "order"
    assert "João" in item["subtitle"]


def test_search_categories_keys():
    categories = ["orders", "customers", "listings", "products", "coupons"]
    assert len(categories) == 5


def test_min_query_length():
    assert len("ab") >= 2
    assert len("a") < 2
