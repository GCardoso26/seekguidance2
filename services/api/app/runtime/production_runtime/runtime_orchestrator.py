"""Orquestrador de workers/runtime (stub coordenado)."""

from __future__ import annotations

from typing import Any


def orchestrate_runtime_stub(
    *,
    replay_workers: int,
    semantic_workers: int,
    graph_workers: int,
) -> dict[str, Any]:
    return {
        "replay_workers": replay_workers,
        "semantic_workers": semantic_workers,
        "graph_workers": graph_workers,
        "balanced": replay_workers >= 1 and semantic_workers >= 1,
    }
