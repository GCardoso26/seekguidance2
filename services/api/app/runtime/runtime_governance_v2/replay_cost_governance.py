"""Governança de custo de replay (stub v2)."""

from __future__ import annotations

from typing import Any


def replay_cost_governance_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "replay_trust": 0.8,
        "assistant_notes": ["replay_cost_governance: caps declarativos; lineage preservado."],
    }
