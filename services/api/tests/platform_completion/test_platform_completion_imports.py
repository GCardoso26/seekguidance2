"""platform_completion."""
from __future__ import annotations

from app.runtime.platform_completion.runtime_platform_completion_runtime_v1 import (
    runtime_platform_completion_runtime_v1_stub,
)

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


def test_platform_completion_payload() -> None:
    p = runtime_platform_completion_runtime_v1_stub("pp-plat")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
