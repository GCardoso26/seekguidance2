"""federated_production_runtime_v3."""
from __future__ import annotations

from app.runtime.replay_federation.federation_production_router_v3 import federation_production_router_v3_stub

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


def test_federated_production_runtime_v3_payload() -> None:
    p = federation_production_router_v3_stub("cpv3-fed")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
