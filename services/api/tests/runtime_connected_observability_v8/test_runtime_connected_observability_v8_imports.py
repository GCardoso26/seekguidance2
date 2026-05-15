"""runtime_connected_observability_v8."""
from __future__ import annotations

from app.runtime.runtime_connected_observability.runtime_observability_summary_v8 import (
    runtime_observability_summary_v8_stub,
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


def test_runtime_connected_observability_v8_payload() -> None:
    p = runtime_observability_summary_v8_stub("epv2-obs")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
