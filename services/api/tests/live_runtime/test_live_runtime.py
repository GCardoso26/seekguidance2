"""Live observability runtime."""

from __future__ import annotations

from app.observability.live_runtime import (
    branch_cost_heatmap_stub,
    distributed_legality_trace_bundle,
    join_multiplayer_traces,
    legality_replay_diff_stub,
    live_metrics_registry_status,
    live_trace_pipeline_stub,
    mobile_runtime_metrics_stub,
    replay_runtime_trace_stub,
    solver_runtime_trace_stub,
)


def test_live_pipeline() -> None:
    assert live_trace_pipeline_stub(["a", "b"])["live"] is True


def test_mobile_runtime_metrics() -> None:
    out = mobile_runtime_metrics_stub("sess-1")
    assert "replay_summary" in out and "assistant_notes" in out


def test_replay_trace_stub() -> None:
    r = replay_runtime_trace_stub("rid")
    assert "payload" in r


def test_distributed_legality() -> None:
    assert distributed_legality_trace_bundle(["x"])["joined"] is True


def test_solver_trace() -> None:
    assert solver_runtime_trace_stub("s1")["solver"] == "s1"


def test_join_mp() -> None:
    assert join_multiplayer_traces([{}, {}])["players"] == 2


def test_legality_diff() -> None:
    d = legality_replay_diff_stub({"a": 1}, {"a": 2})
    assert "a" in d["diff_keys"]


def test_metrics() -> None:
    m = live_metrics_registry_status()
    assert "registry" in m


def test_heatmap() -> None:
    h = branch_cost_heatmap_stub({"replay": 1.0})
    assert "replay" in h["heatmap"]
