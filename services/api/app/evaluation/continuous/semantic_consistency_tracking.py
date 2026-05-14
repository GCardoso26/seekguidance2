"""Consistência semântica agregada."""

from __future__ import annotations


def semantic_consistency_tracking(scores: list[float]) -> dict[str, object]:
    if not scores:
        return {"ok": True, "spread": 0.0}
    spread = max(scores) - min(scores)
    return {"ok": spread < 0.15, "spread": round(spread, 4)}
