"""federation_supervision_v2."""
from __future__ import annotations

from app.runtime.replay_federation.federation_supervision_runtime_v2 import federation_supervision_runtime_v2_stub

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "divergence_summary",
    "operational_notes",
    "replay_summary",
    "governance_summary",
)

def test_federation_supervision_v2_payload() -> None:
    p = federation_supervision_runtime_v2_stub("fed10")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
