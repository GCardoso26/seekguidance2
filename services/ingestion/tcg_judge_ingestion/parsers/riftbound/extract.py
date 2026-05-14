"""Riftbound — placeholder modular."""

from __future__ import annotations

from typing import Any

from tcg_judge_ingestion.parsers._stub_extract import empty_extract


def extract_riftbound_signals(text: str) -> dict[str, Any]:
    out = empty_extract(text)
    out["timing"].append("riftbound_custom_placeholder")
    return out
