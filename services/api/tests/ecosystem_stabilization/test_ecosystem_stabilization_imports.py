"""ecosystem_stabilization."""
from __future__ import annotations

from app.runtime.runtime_canonical.canonical_runtime_ecosystem_summary_v1 import (
    canonical_runtime_ecosystem_summary_v1_stub,
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
    "integrity_status",
)


def test_ecosystem_stabilization_payload() -> None:
    p = canonical_runtime_ecosystem_summary_v1_stub("om31-eco")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
