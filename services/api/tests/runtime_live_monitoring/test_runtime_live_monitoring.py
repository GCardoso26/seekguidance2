"""Runtime live monitoring."""

from __future__ import annotations

from app.observability.live_runtime import (
    distributed_trace_alignment_stub,
    live_replay_anomaly_stub,
    ontology_drift_runtime_live_stub,
    replay_entropy_monitoring_stub,
    runtime_branch_monitoring_stub,
    runtime_cost_tracking_stub,
    semantic_hotspot_alerts_stub,
    solver_runtime_monitoring_stub,
)


def test_live_replay_anomaly() -> None:
    assert live_replay_anomaly_stub(0.9)["anomaly"] is True


def test_branch_monitoring() -> None:
    assert runtime_branch_monitoring_stub(50, cap=10)["over_cap"] is True


def test_solver_runtime_monitoring() -> None:
    assert solver_runtime_monitoring_stub(200.0, budget_ms=100.0)["over_budget"] is True


def test_semantic_hotspot_alerts() -> None:
    assert semantic_hotspot_alerts_stub("lbl", rate=20.0)["alert"] is True


def test_ontology_drift_live() -> None:
    assert ontology_drift_runtime_live_stub(0.5, threshold=0.2)["breach"] is True


def test_distributed_trace_alignment() -> None:
    assert distributed_trace_alignment_stub(["t", "t"])["aligned"] is True


def test_runtime_cost() -> None:
    assert runtime_cost_tracking_stub(200.0)["degraded"] is True


def test_replay_entropy_monitoring() -> None:
    assert replay_entropy_monitoring_stub(0.9)["hot"] is True
