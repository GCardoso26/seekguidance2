"""Limites de emergência de runtime."""

from __future__ import annotations


def runtime_emergency_limits(*, freeze_semantic: bool, collapse_graph: bool) -> dict[str, bool]:
    return {
        "hard_replay_cap": True,
        "semantic_freeze": freeze_semantic,
        "emergency_graph_collapse": collapse_graph,
        "distributed_overload_fallback": freeze_semantic or collapse_graph,
    }
