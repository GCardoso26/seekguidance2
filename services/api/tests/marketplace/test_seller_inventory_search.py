"""Smoke tests for seller inventory multi-source search helpers."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.marketplace.seller_inventory_search import (
    _image_from_uris,
    _row_item,
    adjust_inventory,
)


def test_row_item_defaults():
    item = _row_item(id="1", kind="cards", title="Pikachu", quantity=2, price_cents=1500)
    assert item["id"] == "1"
    assert item["kind"] == "cards"
    assert item["title"] == "Pikachu"
    assert item["quantity"] == 2
    assert item["price_cents"] == 1500
    assert item["condition"] == "NM"
    assert item["language"] == "pt"
    assert item["foil"] is False
    assert item["listing_id"] is None


def test_image_from_uris_prefers_url():
    assert _image_from_uris("https://a/img.png", {"normal": "https://b/n.png"}) == "https://a/img.png"
    assert _image_from_uris(None, {"normal": "https://b/n.png"}) == "https://b/n.png"
    assert _image_from_uris(None, None) is None


@pytest.mark.asyncio
async def test_adjust_product_create_from_title_only():
    session = AsyncMock()
    store_row = MagicMock()
    store_row.__getitem__ = lambda self, k: {"id": "store-1", "slug": "s", "name": "S", "owner_id": "owner-1"}[k]
    # _resolve_store uses mappings().first()
    result = MagicMock()
    result.mappings.return_value.first.return_value = {
        "id": "store-1",
        "slug": "s",
        "name": "S",
        "owner_id": "owner-1",
    }
    # first execute = resolve store; second = find existing product (None); then create_product
    session.execute = AsyncMock(return_value=result)

    with (
        patch(
            "app.marketplace.seller_inventory_search.shop_products_svc.create_product",
            new_callable=AsyncMock,
        ) as create_prod,
        patch(
            "app.marketplace.seller_inventory_search.shop_products_svc.update_product",
            new_callable=AsyncMock,
        ),
    ):
        # existing product lookup returns None
        none_result = MagicMock()
        none_result.mappings.return_value.first.return_value = None

        async def _exec(sql, params=None):
            sql_str = str(sql)
            if "FROM tcg_judge.stores" in sql_str:
                return result
            return none_result

        session.execute = AsyncMock(side_effect=_exec)
        create_prod.return_value = {"id": "new-p", "stock": 4, "name": "Test Sleeve"}

        out = await adjust_inventory(
            session,
            "owner-1",
            kind="products",
            mode="set",
            quantity=4,
            title="Test Sleeve",
            category="sleeve",
            price_cents=2000,
        )
        assert out["created"] is True
        create_prod.assert_awaited_once()
