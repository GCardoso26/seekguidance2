"""Entropia / pressão de replay (live)."""

from __future__ import annotations

from typing import Any


def replay_entropy_monitoring_stub(entropy: float) -> dict[str, Any]:
    return {"entropy": entropy, "hot": entropy > 0.75}
