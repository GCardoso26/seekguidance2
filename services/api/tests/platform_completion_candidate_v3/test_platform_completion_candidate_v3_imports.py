"""platform_completion_candidate_v3."""
from __future__ import annotations

from app.runtime.platform_completion.runtime_platform_completion_v3 import runtime_platform_completion_v3_stub

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


def test_platform_completion_candidate_v3_payload() -> None:
    p = runtime_platform_completion_v3_stub("cpv3-plat")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
