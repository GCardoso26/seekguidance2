"""Extração heurística Yu-Gi-Oh (SEGOC / chain)."""

from __future__ import annotations

from typing import Any


def extract_yugioh_signals(text: str) -> dict[str, Any]:
    t = text.lower()
    timing: list[str] = []
    if "segoc" in t or "simultaneous" in t:
        timing.append("segoc")
    if "missed timing" in t or "optional" in t:
        timing.append("optional_timing")
    windows = ["chain_build"] if "chain" in t else []
    return {
        "timing": timing,
        "windows": windows,
        "constraints": [],
        "dependencies": [],
        "state_transitions": [],
        "replacement_semantics": [],
        "trigger_semantics": ["chain_response"] if "chain" in t else [],
        "combat_semantics": [],
        "chain_stack_semantics": ["chain"],
        "tournament_procedures": [],
        "policy_infractions": [],
    }
