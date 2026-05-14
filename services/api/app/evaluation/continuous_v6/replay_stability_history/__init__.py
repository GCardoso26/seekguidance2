"""Histórico de estabilidade de replay."""

from __future__ import annotations

from typing import Any


def replay_stability_history_stub(runs: list[bool]) -> dict[str, Any]:
    stable_ratio = sum(1 for r in runs if r) / len(runs) if runs else 1.0
    return {"stable_ratio": stable_ratio, "runs": len(runs)}
