"""performance_engineering_v3."""
from __future__ import annotations

from app.runtime.performance_engineering.runtime_runtime_efficiency_summary_v3 import (
    runtime_runtime_efficiency_summary_v3_stub,
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


def test_performance_engineering_v3_payload() -> None:
    p = runtime_runtime_efficiency_summary_v3_stub("epv2-perf")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
