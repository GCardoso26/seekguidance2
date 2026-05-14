"""Estabilidade de replay (v7)."""

from __future__ import annotations

from typing import Any


def replay_stability_tracking_v7_stub(runs: list[bool]) -> dict[str, Any]:
    return {
        "stable_ratio": sum(runs) / len(runs) if runs else 1.0,
        "replay_regression_history": runs,
        "assistant_notes": ["Deterministic replay governance."],
    }
