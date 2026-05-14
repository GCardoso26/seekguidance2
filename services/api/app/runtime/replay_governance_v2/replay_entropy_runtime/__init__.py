"""Entropia de replay em runtime."""

from __future__ import annotations

from typing import Any


def replay_entropy_runtime_stub(entropy: float) -> dict[str, Any]:
    return {"entropy": entropy, "replay_drift_tracking": entropy > 0.5, "assistant_notes": ["Replay entropy runtime."]}
