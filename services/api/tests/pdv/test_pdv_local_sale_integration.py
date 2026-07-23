"""Regression — PDV sale items carry local source + infinite stock rules."""

from __future__ import annotations

import inspect

from app.marketplace import shop_pdv


def test_normalize_handles_local_source_in_source():
    src = inspect.getsource(shop_pdv._normalize_pdv_items)
    assert 'source == "local"' in src
    assert "pdv.local_products" in src
    assert "cost_cents" in src


def test_commit_stock_skips_null_local_stock():
    src = inspect.getsource(shop_pdv._commit_pdv_stock)
    assert "pdv.local_products" in src
    assert "stock IS NOT NULL" in src


def test_search_merges_official_and_local():
    src = inspect.getsource(shop_pdv.search_pdv_products)
    assert 'row["source"] = "local"' in src
    assert 'row["source"] = "official"' in src
    assert "pdv.local_products" in src
