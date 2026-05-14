"""Pruning adaptativo (v5)."""

from __future__ import annotations

from typing import Any


def adaptive_pruning_runtime_v5_stub(depth: int, max_depth: int) -> dict[str, Any]:
    return {
        "pruned": depth > max_depth,
        "entropy_scoring": depth / max(max_depth, 1),
        "assistant_notes": ["Pruning distribuído requer caps consistentes entre workers."],
    }
