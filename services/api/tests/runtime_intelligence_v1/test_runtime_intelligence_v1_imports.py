"""runtime_intelligence_v1."""
from __future__ import annotations

from app.observability.runtime_exporters.runtime_intelligence_engine_v1 import runtime_intelligence_engine_v1_stub

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


def test_runtime_intelligence_v1_payload() -> None:
    p = runtime_intelligence_engine_v1_stub("cpv3-intel")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
