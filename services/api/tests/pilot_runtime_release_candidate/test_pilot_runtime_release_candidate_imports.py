"""pilot_runtime_release_candidate."""
from __future__ import annotations

from app.runtime.pilot_runtime.pilot_runtime_release_candidate_summary_v1 import (
    pilot_runtime_release_candidate_summary_v1_stub,
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


def test_pilot_runtime_release_candidate_payload() -> None:
    p = pilot_runtime_release_candidate_summary_v1_stub("rc-pilot")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
