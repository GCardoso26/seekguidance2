"""Harness adversarial agregado."""

from __future__ import annotations

from app.testing.adversarial.graph_explosion_cases import graph_explosion
from app.testing.adversarial.layer_conflicts import layer_conflict_detected
from app.testing.adversarial.recursion_storms import recursion_storm_depth
from app.testing.adversarial.replacement_loops import replacement_loop_score


def run_adversarial_runtime() -> dict[str, object]:
    rec = recursion_storm_depth(depth=80, cap=64)
    graph = graph_explosion(nodes=4500, cap=4096)
    return {
        "recursion_overflow": bool(rec["overflow"]),
        "graph_exploded": bool(graph["exploded"]),
        "replacement_loop_score": replacement_loop_score(7),
        "layer_conflict_detected": layer_conflict_detected(["7c", "7c"]),
    }
