"""Testes Sprint 15 — wishlist aggregate."""

from __future__ import annotations

import pytest
from app.marketplace.wishlist_aggregate import (
    ensure_default_lists_payload,
    merge_list_names,
    slugify_name,
    validate_list_name,
    validate_slug,
)
from fastapi import HTTPException


def test_slugify_name():
    assert slugify_name("Commander Decks!") == "commander-decks"
    assert slugify_name("  ") == "lista"


def test_validate_list_name_ok():
    assert validate_list_name("Favoritos") == "Favoritos"


def test_validate_list_name_rejects_empty():
    with pytest.raises(HTTPException):
        validate_list_name("")


def test_validate_slug():
    assert validate_slug("compra-futura") == "compra-futura"
    with pytest.raises(HTTPException):
        validate_slug("bad slug")


def test_default_lists_seed():
    lists = ensure_default_lists_payload("user-1")
    assert len(lists) >= 7
    assert lists[0]["is_default"] is True


def test_merge_list_names():
    assert "Favoritos" in merge_list_names("Favoritos", "Decks")
