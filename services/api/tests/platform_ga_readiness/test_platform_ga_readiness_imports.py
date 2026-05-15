"""platform_ga_readiness."""
from __future__ import annotations

from app.runtime.platform_ga_readiness.platform_ga_operational_summary_v1 import platform_ga_operational_summary_v1_stub

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


def test_platform_ga_readiness_payload() -> None:
    p = platform_ga_operational_summary_v1_stub("gav2-ga")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
