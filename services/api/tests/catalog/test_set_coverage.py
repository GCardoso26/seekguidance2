"""Testes de cobertura de coleções e helpers de sync."""

from app.tcg_adapters.sync_common import resolve_tcgdex_image


def test_resolve_tcgdex_image_appends_high_webp():
    base = "https://assets.tcgdex.net/en/base1/4"
    assert resolve_tcgdex_image(base) == f"{base}/high.webp"


def test_resolve_tcgdex_image_keeps_existing_extension():
    url = "https://assets.tcgdex.net/en/base1/4/high.webp"
    assert resolve_tcgdex_image(url) == url


def test_resolve_tcgdex_image_builds_from_set_and_local_id():
    url = resolve_tcgdex_image(None, set_id="base1", local_id="4")
    assert url == "https://assets.tcgdex.net/en/base1/4/high.webp"


def test_classify_empty_set_metadata_and_source_gap():
    from app.catalog.set_coverage import _classify_empty_set

    assert _classify_empty_set("FAB", "1HB", {}, source_cards=None) == "metadata_only"
    assert _classify_empty_set("LORCANA", "QU1", {"card_count": 35}, source_cards=0) == "source_gap"
    assert _classify_empty_set("SWU", "SOROPJ", {"card_count": 2}, source_cards=0) == "source_gap"
    assert _classify_empty_set("SWU", "SS1", {"card_count": 0}, source_cards=None) == "metadata_only"
    assert (
        _classify_empty_set("SWU", "TASH", {"card_count": 3}, source_cards=0) == "source_gap"
    )
    assert _classify_empty_set("YGO", "YS15", {"card_count": 42}, source_cards=None) == "sync_gap"
