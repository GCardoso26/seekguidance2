"""Production runtime observability."""

from __future__ import annotations

from app.core.config import Settings
from app.observability.production_runtime import (
    export_runtime_trace_meta,
    join_trace_parts,
    profiling_live_snapshot,
    prometheus_metrics_status,
    replay_trace_runtime_bundle,
    runtime_diagnostics_bundle,
    runtime_sample_decision,
)


def _s() -> Settings:
    return Settings(database_url="postgresql+asyncpg://x", redis_url="redis://x")


def test_export_trace() -> None:
    m = export_runtime_trace_meta(_s(), trace_id="t1")
    assert m["trace_id"] == "t1"


def test_join_traces() -> None:
    j = join_trace_parts([{"trace_id": "a"}, {"trace_id": "a"}])
    assert j["joined"] is True


def test_sampling() -> None:
    assert isinstance(runtime_sample_decision(_s()), bool)


def test_prometheus_status() -> None:
    s = prometheus_metrics_status()
    assert "prometheus_client" in s


def test_runtime_diag_bundle() -> None:
    d = runtime_diagnostics_bundle([{"x": 1}], [{"x": 2}], graph_considered=50, graph_kept=5)
    assert "replay" in d


def test_profiling_live() -> None:
    p = profiling_live_snapshot()
    assert "hotspots" in p


def test_replay_trace_runtime() -> None:
    r = replay_trace_runtime_bundle("r1", reasoning_version="v5")
    assert "payload" in r
