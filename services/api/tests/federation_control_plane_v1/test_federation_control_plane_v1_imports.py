"""federation_control_plane_v1."""
from __future__ import annotations

from app.runtime.federation_control_plane.federation_control_plane_engine_v1 import (
    federation_control_plane_engine_v1_stub,
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
)


def test_federation_control_plane_v1_payload() -> None:
    p = federation_control_plane_engine_v1_stub("cpv3-fcp")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
