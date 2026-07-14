"""Unit tests — Inventory dashboard/export/bulk/analytics helpers (Sprint 17)."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.marketplace.seller_inventory_analytics import _suggestions
from app.marketplace.seller_inventory_bulk import bulk_inventory
from app.marketplace.seller_inventory_export import export_inventory
from fastapi import HTTPException


def test_suggestions_from_dashboard_actions():
    dash = {
        "actions": [
            {"id": "missing_image", "count": 3, "label": "Sem imagem"},
            {"id": "out_of_stock", "count": 2, "label": "Sem estoque"},
            {"id": "low_stock", "count": 0, "label": "Low"},
        ]
    }
    tips = _suggestions(dash, health_avg=40.0)
    ids = {t["id"] for t in tips}
    assert "fix_images" in ids
    assert any("estoque" in t["text"].lower() or "sem estoque" in t["text"].lower() for t in tips)
    assert all("filter" in t for t in tips)


def test_suggestions_ok_when_no_actions():
    tips = _suggestions({"actions": [{"id": "out_of_stock", "count": 0}]}, health_avg=95.0)
    assert len(tips) == 1
    assert tips[0]["id"] == "ok"


@pytest.mark.asyncio
async def test_bulk_rejects_empty_selection():
    with pytest.raises(HTTPException) as exc:
        await bulk_inventory(AsyncMock(), "owner-1", action="publish", items=[])
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_bulk_rejects_oversized_batch():
    items = [{"id": str(i), "kind": "products", "product_id": str(i)} for i in range(51)]
    with pytest.raises(HTTPException) as exc:
        await bulk_inventory(AsyncMock(), "owner-1", action="publish", items=items)
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_export_json_filters_by_ids():
    fake_items = [
        {"id": "a", "kind": "products", "title": "A", "quantity": 1, "price_cents": 100, "health": {"score": 90}},
        {"id": "b", "kind": "products", "title": "B", "quantity": 2, "price_cents": 200, "health": {"score": 80}},
    ]
    with patch(
        "app.marketplace.seller_inventory_export.search_inventory",
        new=AsyncMock(return_value={"items": fake_items}),
    ), patch(
        "app.marketplace.seller_inventory_export.enrich_items_with_health",
        side_effect=lambda items: items,
    ):
        out = await export_inventory(
            MagicMock(),
            "owner-1",
            fmt="json",
            ids=["b"],
        )
    assert out["format"] == "json"
    assert out["filename"].endswith(".json")
    assert '"title": "B"' in out["content"]
    assert '"title": "A"' not in out["content"]


@pytest.mark.asyncio
async def test_export_csv_has_header():
    with patch(
        "app.marketplace.seller_inventory_export.search_inventory",
        new=AsyncMock(
            return_value={
                "items": [
                    {
                        "id": "1",
                        "kind": "products",
                        "title": "Sleeve",
                        "quantity": 4,
                        "price_cents": 500,
                        "sku": "SKU1",
                        "health": {"score": 85},
                    }
                ]
            }
        ),
    ), patch(
        "app.marketplace.seller_inventory_export.enrich_items_with_health",
        side_effect=lambda items: items,
    ):
        out = await export_inventory(MagicMock(), "owner-1", fmt="csv")
    assert out["format"] == "csv"
    assert out["content"].startswith("id,kind,title")
    assert "Sleeve" in out["content"]


@pytest.mark.asyncio
async def test_dashboard_shape_with_mocked_session():
    from app.marketplace.seller_inventory_dashboard import get_inventory_dashboard

    products_row = {
        "active_products": 2,
        "out_of_stock": 1,
        "low_stock": 0,
        "missing_image": 1,
        "missing_price": 0,
        "unpublished": 0,
        "archived": 0,
        "total_units": 10,
        "value_cents": 1000,
    }
    listings_row = {
        "active_listings": 3,
        "out_of_stock_listings": 0,
        "low_stock_listings": 1,
        "unpublished_listings": 0,
        "archived_listings": 0,
        "total_card_units": 5,
        "listings_value_cents": 500,
    }

    class _Result:
        def __init__(self, row):
            self._row = row

        def mappings(self):
            return self

        def first(self):
            return self._row

    session = AsyncMock()
    session.execute = AsyncMock(
        side_effect=[
            _Result(products_row),
            _Result(listings_row),
            _Result({"c": 2}),
        ]
    )

    with patch(
        "app.marketplace.seller_inventory_dashboard._resolve_store",
        new=AsyncMock(return_value={"id": "store-1"}),
    ):
        dash = await get_inventory_dashboard(session, "owner-1")

    assert dash["store_id"] == "store-1"
    assert dash["totals"]["active_products"] == 2
    assert dash["totals"]["active_listings"] == 3
    assert dash["totals"]["total_units"] == 15
    assert dash["totals"]["value_cents"] == 1500
    action_ids = {a["id"] for a in dash["actions"]}
    assert {"out_of_stock", "low_stock", "missing_image", "unpublished"}.issubset(action_ids)
    out = next(a for a in dash["actions"] if a["id"] == "out_of_stock")
    assert out["count"] == 1
