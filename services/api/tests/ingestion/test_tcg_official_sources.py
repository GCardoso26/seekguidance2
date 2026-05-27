"""Catálogo de PDFs oficiais multi-TCG."""

from __future__ import annotations

from tcg_judge_ingestion.crawler.tcg_official_sources import (
    LOCAL_PDF_FILENAMES,
    LOCAL_PDF_ONLY,
    list_official_pdfs,
    resolve_ingest_game_slug,
)

INGEST_GAMES = (
    "pokemon",
    "lorcana",
    "yugioh",
    "onepiece",
    "fab",
    "digimon",
    "gundam",
    "dbfw",
    "sorcery",
    "vanguard",
    "riftbound",
    "union_arena",
)


def test_pokemon_has_cr_and_mtr() -> None:
    pdfs = list_official_pdfs("pokemon")
    types = {p.doc_type for p in pdfs}
    assert "CR" in types
    assert "MTR" in types
    assert all(p.url.startswith("https://") for p in pdfs)


def test_all_games_have_core_rules() -> None:
    for game in INGEST_GAMES:
        pdfs = list_official_pdfs(game)
        assert any(p.doc_type == "CR" for p in pdfs), game
        assert all(p.url.startswith("https://") for p in pdfs), game


def test_ingest_slug_aliases() -> None:
    assert resolve_ingest_game_slug("flesh_and_blood") == "fab"
    assert resolve_ingest_game_slug("dragon_ball") == "dbfw"
    assert list_official_pdfs("flesh_and_blood")


def test_sorcery_requires_local_pdf() -> None:
    assert ("sorcery", "CR") in LOCAL_PDF_ONLY
    assert LOCAL_PDF_FILENAMES[("sorcery", "CR")]
    pdfs = list_official_pdfs("sorcery")
    assert len(pdfs) == 1 and pdfs[0].doc_type == "CR"
