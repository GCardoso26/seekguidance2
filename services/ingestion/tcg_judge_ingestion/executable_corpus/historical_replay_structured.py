"""Replay estruturado a partir de arquivo (timeline + ramos)."""

from __future__ import annotations

from typing import Any


def structured_replay_timeline(events: list[dict[str, Any]]) -> dict[str, Any]:
    ticks = [e.get("tick", 0) for e in events]
    return {
        "timeline_ticks": sorted(ticks),
        "branch_expectations": [],
        "replacement_chains": [],
        "apnap_sequence": [],
        "segoc_timeline": [],
        "assistant_note": "Preencher com parser por TCG; formato estável para regressões.",
    }
