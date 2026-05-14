"""Lorcana — ink / lore."""

from __future__ import annotations

from typing import Any

from tcg_judge_ingestion.parsers._stub_extract import empty_extract


def extract_lorcana_signals(text: str) -> dict[str, Any]:
    out = empty_extract(text)
    tl = text.lower()
    if "ink" in tl:
        out["timing"].append("ink_exhaust")
    if "lore" in tl:
        out["state_transitions"].append("lore_progression")
    return out
