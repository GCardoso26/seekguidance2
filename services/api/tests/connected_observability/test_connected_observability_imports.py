"""connected_observability."""
from __future__ import annotations

from app.observability.runtime_exporters.runtime_otel_live_connector_v1 import runtime_otel_live_connector_v1_stub

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "divergence_summary",
    "operational_notes",
    "replay_summary",
    "governance_summary",
    "lineage_summary",
)


def test_connected_observability_payload() -> None:
    p = runtime_otel_live_connector_v1_stub("pp-otel")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
