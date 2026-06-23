"""Testes do checkout atômico (helpers e lógica de sessão)."""

from __future__ import annotations

import json

import pytest
from app.marketplace.checkout_atomic import _parse_locked_items


class TestParseLockedItems:
    def test_empty_none(self):
        assert _parse_locked_items(None) == []

    def test_json_string(self):
        raw = json.dumps([{"product_id": "abc", "quantity": 2}])
        assert len(_parse_locked_items(raw)) == 1

    def test_list_passthrough(self):
        items = [{"product_id": "x", "quantity": 1}]
        assert _parse_locked_items(items) == items

    def test_invalid_type(self):
        assert _parse_locked_items(42) == []


def test_checkout_timeout_constant():
    from app.marketplace.checkout_atomic import CHECKOUT_TIMEOUT_MINUTES

    assert CHECKOUT_TIMEOUT_MINUTES == 15


@pytest.mark.asyncio
async def test_finalize_skips_unknown_session():
    from unittest.mock import AsyncMock, MagicMock

    from app.marketplace.checkout_atomic import finalize_checkout

    db = AsyncMock()
    result = MagicMock()
    result.mappings.return_value.first.return_value = None
    db.execute = AsyncMock(return_value=result)

    out = await finalize_checkout(db, "00000000-0000-0000-0000-000000000099")
    assert out.get("skipped") is True
