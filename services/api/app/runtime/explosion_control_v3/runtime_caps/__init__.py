"""Caps de runtime (emergência)."""

from __future__ import annotations


def runtime_safety_caps(*, branch: int, graph: int, replay_depth: int) -> dict[str, int]:
    return {
        "branch_cap": min(branch, 256),
        "graph_cap": min(graph, 2048),
        "replay_depth_cap": min(replay_depth, 4096),
        "emergency_collapse": branch > 200 or graph > 1500,
    }
