"""public_runtime_api."""
from __future__ import annotations

from app.runtime.public_runtime_api.public_runtime_api_summary_v1 import public_runtime_api_summary_v1_stub

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


def test_public_runtime_api_payload() -> None:
    p = public_runtime_api_summary_v1_stub("ga30-pub")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
