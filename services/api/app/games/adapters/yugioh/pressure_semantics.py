"""Pressão competitiva YGO (SEGOC / chain) — heurísticas soft, sem equivalência MTG."""

from __future__ import annotations

from typing import Any


def segoc_maturity_flags(text: str) -> dict[str, Any]:
    t = text.lower()
    return {
        "segoc": "segoc" in t or "simultaneous" in t,
        "chain_legality": "chain" in t,
        "hidden_timing_risk": "optional" in t and "when" in t,
        "mandatory_optional": "mandatory" in t and "optional" in t,
    }


def chain_blocking_legality_stub(chain_len: int, max_len: int = 16) -> dict[str, Any]:
    return {"legal": chain_len <= max_len, "chain_len": chain_len}
