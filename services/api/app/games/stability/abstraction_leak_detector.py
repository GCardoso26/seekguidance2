"""Deteção heurística de leakage de abstração (soft checks)."""

from __future__ import annotations


def detect_abstraction_leak_risk(cross_refs: int, *, threshold: int = 12) -> dict[str, object]:
    return {"risk": cross_refs > threshold, "cross_refs": cross_refs, "threshold": threshold}
