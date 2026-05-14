"""Pruning de runtime móvel v6 (stub)."""

from __future__ import annotations

from typing import Any


def mobile_runtime_pruning_v2_stub(nodes: int, cap: int) -> dict[str, Any]:
    return {
        "nodes": nodes,
        "cap": cap,
        "pruned": max(0, nodes - cap),
        "assistant_notes": ["Pruning v6 cooperante com v5; sem remoção de stubs antigos."],
        "replay_summary": {"survivors": min(nodes, cap)},
        "deterministic_alignment": {"order": "stable"},
    }
