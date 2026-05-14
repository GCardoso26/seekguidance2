"""Observabilidade operacional live (OTEL/Prometheus hooks)."""

from __future__ import annotations

from app.observability.live_runtime import (
    otel_live_export_runtime_stub,
    prometheus_runtime_metrics_stub,
    replay_entropy_live_stub,
    runtime_cost_governance_live_stub,
    runtime_regression_alerts_stub,
)


def test_otel_live() -> None:
    assert otel_live_export_runtime_stub("localhost:4317")["endpoint"]


def test_prometheus_runtime() -> None:
    assert prometheus_runtime_metrics_stub("judge_api")["job"] == "judge_api"


def test_replay_entropy_live() -> None:
    assert replay_entropy_live_stub(0.5)["score"] == 0.5


def test_runtime_regression_alerts() -> None:
    assert runtime_regression_alerts_stub(True)["regressed"] is True


def test_runtime_cost_governance_live() -> None:
    assert runtime_cost_governance_live_stub(10.0, cap=5.0)["breach"] is True
