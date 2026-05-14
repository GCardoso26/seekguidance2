"""Extração Pokémon (stub + prémios)."""

from __future__ import annotations

from typing import Any

from tcg_judge_ingestion.parsers._stub_extract import empty_extract


def extract_pokemon_signals(text: str) -> dict[str, Any]:
    out = empty_extract(text)
    if "prize" in text.lower():
        out["timing"].append("prize_card_timing")
    return out
