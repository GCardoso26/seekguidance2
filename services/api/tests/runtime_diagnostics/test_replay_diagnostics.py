"""Replay diagnostics."""

from __future__ import annotations

from app.core.config import Settings
from app.observability.runtime_tracing import (
    branch_explosion_alerts,
    build_otel_exporter_config,
    export_replay_trace_bundle,
    graph_runtime_diagnostics,
    replay_diagnostics_bundle,
)


def test_replay_diagnostics() -> None:
    a = [{"t": 1}, {"t": 2}]
    b = [{"t": 1}]
    d = replay_diagnostics_bundle(a, b)
    assert d["deterministic_mismatch"] is True


def test_branch_alert() -> None:
    assert branch_explosion_alerts(20, 10)["firing"] is True


def test_graph_diag() -> None:
    g = graph_runtime_diagnostics(considered=100, kept=10)
    assert "heavy_pruning" in g["alerts"]


def test_otel_exporter() -> None:
    s = Settings(database_url="postgresql+asyncpg://x", redis_url="redis://x")
    cfg = build_otel_exporter_config(s)
    assert "assistant_safe" in cfg


def test_export_replay() -> None:
    e = export_replay_trace_bundle("r1", reasoning_version="v3")
    assert e["kind"] == "replay_trace"
