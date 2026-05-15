"""Instabilidade de ramos de replay (diagnostics v2)."""

from __future__ import annotations

from typing import Any


def replay_branch_instability_v2_stub(replay_ref: str) -> dict[str, Any]:
    return {
        "replay_ref": replay_ref,
        "branch_pressure": {"depth_stub": 3},
        "assistant_notes": ["replay_branch_instability: pressão explicável, não veredito."],
    }
