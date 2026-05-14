"""Comparador diferencial entre duas saídas de execução."""

from __future__ import annotations

from typing import Any


def compare_pipelines(a: dict[str, Any], b: dict[str, Any]) -> dict[str, Any]:
    diffs: list[str] = []
    if a.get("replay_hash") != b.get("replay_hash"):
        diffs.append("replay_hash_mismatch")
    if a.get("roles") != b.get("roles"):
        diffs.append("ordering_mismatch")
    return {
        "pipeline_a_hash": a.get("replay_hash", ""),
        "pipeline_b_hash": b.get("replay_hash", ""),
        "differences_detected": diffs,
        "semantic_divergence": min(1.0, 0.25 * len(diffs)),
    }
