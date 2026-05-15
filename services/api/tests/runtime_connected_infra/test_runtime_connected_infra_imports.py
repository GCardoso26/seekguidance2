"""runtime_connected_infra."""
from __future__ import annotations

from app.runtime.runtime_connected_infra.runtime_connected_infra_summary_v1 import (
    runtime_connected_infra_summary_v1_stub,
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


def test_runtime_connected_infra_payload() -> None:
    p = runtime_connected_infra_summary_v1_stub("epv1-infra")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
