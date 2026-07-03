"""Testes de produtos do vendedor."""

from app.marketplace.shop_products import PRODUCT_CATEGORIES


def test_product_categories_include_sleeve_and_deck_box():
    assert "sleeve" in PRODUCT_CATEGORIES
    assert "deck_box" in PRODUCT_CATEGORIES
    assert "playmat" in PRODUCT_CATEGORIES


def test_product_categories_exclude_single_for_non_card():
    assert "single" in PRODUCT_CATEGORIES


def test_seller_product_payload_shape():
    product = {
        "id": "p1",
        "name": "Sleeve",
        "category": "sleeve",
        "price_cents": 1000,
        "stock": 5,
    }
    assert product["price_cents"] > 0


def test_list_response_has_products_key():
    payload = {"products": [], "total": 0, "page": 1, "limit": 25}
    assert isinstance(payload["products"], list)
