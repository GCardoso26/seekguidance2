"""FAB — combat chain."""

from __future__ import annotations

from typing import Any

from tcg_judge_ingestion.parsers._stub_extract import empty_extract


def extract_fab_signals(text: str) -> dict[str, Any]:
    out = empty_extract(text)
    if "combat chain" in text.lower():
        out["combat_semantics"].append("combat_chain")
    return out
