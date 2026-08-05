"""Regressões do import CSV (merge images + limite ativos)."""

from __future__ import annotations

import inspect

from app.marketplace import shop_inventory, shop_products


def test_merge_update_sql_does_not_cast_images_as_text_array():
    """asyncpg + CAST(:images AS text[]) causava 500 no reimport com merge."""
    src = inspect.getsource(shop_inventory.import_products_csv)
    assert "CAST(:images AS text[])" not in src
    assert "WHEN :has_images THEN :images" in src


def test_bulk_create_accepts_require_image_flag():
    sig = inspect.signature(shop_products.bulk_create_products)
    assert "require_image" in sig.parameters
    assert sig.parameters["require_image"].default is True


def test_bulk_create_counts_only_active_products():
    src = inspect.getsource(shop_products.bulk_create_products)
    assert "WHERE store_id = :sid AND is_active" in src
