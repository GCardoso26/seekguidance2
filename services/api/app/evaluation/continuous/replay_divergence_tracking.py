"""Divergência entre runs de replay (métrica simples)."""

from __future__ import annotations


def replay_divergence_tracking(hashes: list[str]) -> dict[str, object]:
    uniq = len(set(hashes))
    return {"divergence": uniq > 1, "unique_runs": uniq, "total": len(hashes)}
