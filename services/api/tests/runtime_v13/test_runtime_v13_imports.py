"""runtime_v13."""
from __future__ import annotations

from app.runtime.production_runtime_v11.runtime_execution_operational_engine_v4 import (
    runtime_execution_operational_engine_v4_stub,
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


def test_runtime_v13_payload() -> None:
    p = runtime_execution_operational_engine_v4_stub("opv4-exec")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
