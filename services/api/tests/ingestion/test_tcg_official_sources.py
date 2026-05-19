"""Catálogo de PDFs oficiais multi-TCG."""

from __future__ import annotations

from tcg_judge_ingestion.crawler.tcg_official_sources import list_official_pdfs


def test_pokemon_has_standard_and_expanded() -> None:
    pdfs = list_official_pdfs("pokemon")
    types = {p.doc_type for p in pdfs}
    assert "CR" in types
    assert "FORMAT_STANDARD" in types
    assert "FORMAT_EXPANDED" in types
    assert "MTR" in types


def test_all_games_have_core_rules() -> None:
    for game in ("pokemon", "lorcana", "yugioh", "onepiece"):
        pdfs = list_official_pdfs(game)
        assert any(p.doc_type == "CR" for p in pdfs), game
        assert all(p.url.startswith("https://") for p in pdfs), game
