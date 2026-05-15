"""performance_v4_ga."""
from __future__ import annotations

from app.runtime.performance_engineering.runtime_performance_summary_v4 import runtime_performance_summary_v4_stub


def test_performance_v4_ga_imports() -> None:
    r = runtime_performance_summary_v4_stub("ga30-x")
    assert r["runtime_confidence"] > 0
