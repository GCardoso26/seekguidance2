"""performance_cost_engineering."""
from __future__ import annotations

from app.runtime.performance_engineering.runtime_storage_optimization_summary_v2 import (
    runtime_storage_optimization_summary_v2_stub,
)

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "governance_summary",
    "lifecycle_summary",
    "operational_notes",
    "divergence_summary",
    "replay_summary",
    "integrity_status",
)


def test_performance_cost_engineering_payload() -> None:
    p = runtime_storage_optimization_summary_v2_stub("pcv1-perf")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
