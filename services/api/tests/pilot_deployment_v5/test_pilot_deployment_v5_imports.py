"""pilot_deployment_v5."""
from __future__ import annotations

from app.runtime.pilot_runtime.pilot_runtime_operational_summary_v5 import pilot_runtime_operational_summary_v5_stub

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "divergence_summary",
    "operational_notes",
    "replay_summary",
    "governance_summary",
)

def test_pilot_deployment_v5_payload() -> None:
    p = pilot_runtime_operational_summary_v5_stub("pilot10")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
