"""Digimon — memory gauge."""

from __future__ import annotations

from typing import Any

from tcg_judge_ingestion.parsers._stub_extract import empty_extract


def extract_digimon_signals(text: str) -> dict[str, Any]:
    out = empty_extract(text)
    if "memory" in text.lower():
        out["state_transitions"].append("memory_gauge")
    return out
