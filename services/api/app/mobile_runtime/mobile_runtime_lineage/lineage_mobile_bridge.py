"""Lineage runtime móvel (stub)."""

from __future__ import annotations

from typing import Any


def mobile_runtime_lineage_bridge_stub(replay_ref: str) -> dict[str, Any]:
    return {
        "replay_ref": replay_ref,
        "lineage_runtime_summary": {"merged": False, "explainable": True},
        "assistant_notes": ["mobile_runtime_lineage: âncoras temporais preservadas."],
    }
