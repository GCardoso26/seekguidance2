"""runtime_observability_v7."""
from __future__ import annotations

from app.observability.runtime_exporters.runtime_metrics_registry_v7 import runtime_metrics_registry_v7_stub

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "divergence_summary",
    "operational_notes",
    "replay_summary",
    "governance_summary",
)

def test_runtime_observability_v7_payload() -> None:
    p = runtime_metrics_registry_v7_stub("obs10")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
