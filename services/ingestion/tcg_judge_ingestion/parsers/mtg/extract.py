"""Extração heurística MTG (profundidade incremental)."""

from __future__ import annotations

from typing import Any


def extract_mtg_signals(text: str) -> dict[str, Any]:
    t = text.lower()
    timing: list[str] = []
    if "at the beginning of" in t:
        timing.append("beginning_of_step")
    if "whenever" in t or "when " in t:
        timing.append("trigger")
    if "instead" in t:
        timing.append("replacement")
    windows: list[str] = []
    if "priority" in t:
        windows.append("priority_window")
    if "stack" in t:
        windows.append("stack_window")
    constraints: list[str] = []
    if "can't" in t or "cannot" in t:
        constraints.append("restriction")
    deps: list[str] = []
    if "depends on" in t or "timestamp" in t:
        deps.append("dependency_or_timestamp")
    return {
        "timing": timing,
        "windows": windows,
        "constraints": constraints,
        "dependencies": deps,
        "state_transitions": [],
        "replacement_semantics": ["instead_template"] if "instead" in t else [],
        "trigger_semantics": ["on_event"] if "whenever" in t else [],
        "combat_semantics": [],
        "chain_stack_semantics": ["stack"] if "stack" in t else [],
        "tournament_procedures": [],
        "policy_infractions": [],
    }
