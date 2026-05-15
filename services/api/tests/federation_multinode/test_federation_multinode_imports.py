"""federation_multinode."""
from __future__ import annotations

from app.runtime.federation_multinode.federation_multinode_runtime_v1 import federation_multinode_runtime_v1_stub

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "governance_summary",
    "lifecycle_summary",
    "operational_notes",
    "divergence_summary",
    "replay_summary",
    "integrity_status",
)


def test_federation_multinode_payload() -> None:
    p = federation_multinode_runtime_v1_stub("epv1-fed")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
