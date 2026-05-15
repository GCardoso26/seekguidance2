"""connected_observability_v2."""
from __future__ import annotations

from app.observability.runtime_exporters.runtime_live_metrics_engine_v2 import runtime_live_metrics_engine_v2_stub

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "governance_summary",
    "lifecycle_summary",
    "operational_notes",
    "divergence_summary",
    "replay_summary",
)


def test_connected_observability_v2_payload() -> None:
    p = runtime_live_metrics_engine_v2_stub("opv2-obs")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
