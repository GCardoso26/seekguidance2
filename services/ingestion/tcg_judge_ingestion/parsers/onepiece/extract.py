"""One Piece — DON!! / counter."""

from __future__ import annotations

from typing import Any

from tcg_judge_ingestion.parsers._stub_extract import empty_extract


def extract_onepiece_signals(text: str) -> dict[str, Any]:
    out = empty_extract(text)
    if "don!!" in text.lower() or "don " in text.lower():
        out["timing"].append("don_timing")
    return out
