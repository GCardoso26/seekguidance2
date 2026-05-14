"""Stubs de parsers para outros TCGs (expandir com corpus)."""

from __future__ import annotations

from typing import Any


def empty_extract(_text: str) -> dict[str, Any]:
    return {
        "timing": [],
        "windows": [],
        "constraints": [],
        "dependencies": [],
        "state_transitions": [],
        "replacement_semantics": [],
        "trigger_semantics": [],
        "combat_semantics": [],
        "chain_stack_semantics": [],
        "tournament_procedures": [],
        "policy_infractions": [],
    }
