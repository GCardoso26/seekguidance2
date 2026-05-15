"""runtime_observability_v8."""
from __future__ import annotations

from app.observability.runtime_exporters.runtime_operational_metrics_engine_v8 import (
    runtime_operational_metrics_engine_v8_stub,
)

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "divergence_summary",
    "operational_notes",
    "replay_summary",
    "governance_summary",
)


def test_runtime_observability_v8_payload() -> None:
    p = runtime_operational_metrics_engine_v8_stub("rc-obs")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
