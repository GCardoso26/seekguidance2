"""Divergência semântica (v7)."""

from __future__ import annotations

from typing import Any


def semantic_divergence_tracking_v7_stub(samples: list[float]) -> dict[str, Any]:
    return {"max": max(samples) if samples else 0.0, "semantic_instability_history": samples}
