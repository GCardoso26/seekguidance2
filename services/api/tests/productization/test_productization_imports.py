"""productization."""
from __future__ import annotations

from app.runtime.productization.runtime_productization_runtime_v1 import runtime_productization_runtime_v1_stub

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


def test_productization_payload() -> None:
    p = runtime_productization_runtime_v1_stub("epv1-prod")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
