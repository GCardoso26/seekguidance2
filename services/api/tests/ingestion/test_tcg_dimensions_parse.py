"""Dimensões formais de parsing."""

from __future__ import annotations

from tcg_judge_ingestion.parsing.tcg_dimensions import extract_formal_dimensions


def test_extract_includes_apnap_segoc() -> None:
    out = extract_formal_dimensions("mtg", "## Layers\nAPNAP order in multiplayer")
    slots = out["formal_slots"]
    assert slots.get("apnap")
