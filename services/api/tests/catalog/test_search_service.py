"""Testes do filtro de busca facetada do catálogo."""

from app.catalog.search_service import _build_where, _order_by


def test_order_by_newest_prioritizes_set_release_date():
    sql = _order_by("newest")
    assert "cs.release_date DESC" in sql
    assert "last_synced_at" not in sql


def test_build_where_set_code_is_case_insensitive():
    where, params = _build_where(
        game="MTG",
        set_code="SLD",
        rarities=[],
        language=None,
        conditions=[],
        foil=None,
        price_min_cents=None,
        price_max_cents=None,
        query="",
        meili_ids=None,
        card_ids=None,
        colors=None,
    )
    assert "LOWER(cc.set_code) = LOWER(:set_code)" in where
    assert params["set_code"] == "SLD"
    assert params["game"] == "MTG"


def test_build_where_set_code_preserves_lowercase_from_scryfall():
    where, params = _build_where(
        game=None,
        set_code="ktk",
        rarities=[],
        language=None,
        conditions=[],
        foil=None,
        price_min_cents=None,
        price_max_cents=None,
        query="",
        meili_ids=None,
        card_ids=None,
        colors=None,
    )
    assert "LOWER(cc.set_code) = LOWER(:set_code)" in where
    assert params["set_code"] == "ktk"


def test_build_where_rarities_normalize_spaces_to_underscore():
    where, params = _build_where(
        game="LORCANA",
        set_code=None,
        rarities=["super_rare", "Super Rare"],
        language=None,
        conditions=[],
        foil=None,
        price_min_cents=None,
        price_max_cents=None,
        query="",
        meili_ids=None,
        card_ids=None,
        colors=None,
    )
    assert "regexp_replace" in where
    assert params["rarities"] == ["super_rare", "super_rare"]
