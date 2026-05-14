"""Profiling extensions."""

from __future__ import annotations

from app.observability.profiling import (
    graph_expansion_profile,
    profile_branch_cost,
    replay_memory_pressure,
    runtime_hotspot_report,
    semantic_pipeline_profile,
    temporal_runtime_profile,
)


def test_profile_branch() -> None:
    m = profile_branch_cost("x", 10, cap=20)
    assert "elapsed_ms" in m


def test_replay_memory() -> None:
    p = replay_memory_pressure(100, 10)
    assert p["amplification"] > 1.0


def test_graph_semantic_temporal() -> None:
    assert graph_expansion_profile(depth=2, visited=8, budget=10)["visited"] == 8
    s = semantic_pipeline_profile(stages_ms={"a": 1.0, "b": 2.0})
    assert s["total_ms"] == 3.0
    assert temporal_runtime_profile(ticks=5, window=10)["load_proxy"] == 0.5


def test_runtime_hotspots() -> None:
    r = runtime_hotspot_report(["replay", "graph"])
    assert "replay" in r["hotspots"]
