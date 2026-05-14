"""Estabilidade de legalidade ao longo do tempo (série)."""

from __future__ import annotations


def legality_stability_series(flags: list[bool]) -> dict[str, object]:
    if not flags:
        return {"stable": True, "ratio": 1.0}
    ratio = sum(1 for f in flags if f) / len(flags)
    return {"stable": ratio >= 0.9, "ratio": round(ratio, 4)}
