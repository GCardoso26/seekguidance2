"""Consistência de replay em runtime."""

from __future__ import annotations

from typing import Any


def replay_consistency_runtime_stub(score: float) -> dict[str, Any]:
    return {
        "replay_consistency_scoring": score,
        "replay_governance_alerts": score < 0.7,
        "assistant_notes": ["Drift tracking operacional."],
    }
