"""federation_operational_runtime."""
from __future__ import annotations

from app.runtime.replay_federation.federation_runtime_node_heartbeat_v1 import federation_runtime_node_heartbeat_v1_stub

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


def test_federation_operational_runtime_payload() -> None:
    p = federation_runtime_node_heartbeat_v1_stub("pp-fed")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
