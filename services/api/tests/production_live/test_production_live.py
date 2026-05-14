"""Produção / observabilidade live (stubs)."""

from __future__ import annotations

from app.observability.live_runtime import (
    branch_explosion_live_stub,
    cross_tcg_runtime_metrics_stub,
    distributed_trace_runtime_stub,
    ontology_drift_runtime_stub,
    replay_consistency_monitoring_stub,
    replay_diagnostics_live_stub,
    runtime_regression_detection_stub,
    semantic_pipeline_metrics_stub,
    worker_trace_correlation_stub,
)


def test_distributed_trace() -> None:
    assert distributed_trace_runtime_stub("t1", spans=3)["spans"] == 3


def test_semantic_pipeline_metrics() -> None:
    m = semantic_pipeline_metrics_stub("reasoning_v11", latency_ms=12.0)
    assert m["pipeline"] == "reasoning_v11"


def test_replay_diagnostics_live() -> None:
    assert replay_diagnostics_live_stub("r1", drift_score=0.9)["alert"] is True


def test_ontology_drift_runtime() -> None:
    assert ontology_drift_runtime_stub("fab", delta=0.2)["game"] == "fab"


def test_branch_explosion_live() -> None:
    assert branch_explosion_live_stub(width=100, threshold=10)["hot"] is True


def test_runtime_regression() -> None:
    assert runtime_regression_detection_stub(10.0, 20.0)["regressed"] is True


def test_worker_correlation() -> None:
    assert len(worker_trace_correlation_stub(["w1", "w2"])["workers"]) == 2


def test_replay_consistency() -> None:
    assert replay_consistency_monitoring_stub("a", "b")["consistent"] is False


def test_cross_tcg_metrics() -> None:
    assert cross_tcg_runtime_metrics_stub(["mtg", "yugioh"])["count"] == 2
