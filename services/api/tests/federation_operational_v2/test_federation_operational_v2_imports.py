"""federation_operational_v2."""
from __future__ import annotations

from app.runtime.replay_federation.federation_operational_router_v2 import federation_operational_router_v2_stub

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


def test_federation_operational_v2_payload() -> None:
    p = federation_operational_router_v2_stub("opv2-fed")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
