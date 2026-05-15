"""replay_certification."""
from __future__ import annotations

from app.runtime.replay_certification.replay_determinism_certification_v1 import (
    replay_determinism_certification_v1_stub,
)

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


def test_replay_certification_payload() -> None:
    p = replay_determinism_certification_v1_stub("pp-cert")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
