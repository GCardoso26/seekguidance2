"""Consistência simbólica entre passos/estados."""

from __future__ import annotations

from typing import Any


def symbolic_consistency(steps: list[str], snapshots: int) -> dict[str, Any]:
    stable = snapshots >= max(1, len(steps) // 2)
    return {"symbolic_consistent": stable, "snapshots": snapshots, "steps": len(steps)}
