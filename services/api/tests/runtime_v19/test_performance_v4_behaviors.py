"""Performance v4 behaviors."""
from __future__ import annotations

from app.runtime.performance_engineering.runtime_performance_summary_v4 import (
    runtime_performance_optimization_engine_v4,
)


def test_performance_v4_engine() -> None:
    r = runtime_performance_optimization_engine_v4("ga19-perf")
    assert r["performance_score"] > 0
    assert r["snapshot_deduplication"]["deduped"] is True


def test_operational_portal_v2() -> None:
    from app.runtime.product_runtime.runtime_operational_portal_v2 import runtime_operational_ux_engine_v2
    r = runtime_operational_ux_engine_v2("ga19-portal")
    assert r["product_score"] > 0
