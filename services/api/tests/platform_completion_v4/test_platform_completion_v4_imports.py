"""platform_completion_v4."""
from __future__ import annotations

from pathlib import Path

from app.runtime.platform_completion.runtime_platform_completion_engine_v4 import (
    runtime_platform_completion_engine_v4_stub,
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


def test_platform_completion_v4_payload() -> None:
    p = runtime_platform_completion_engine_v4_stub("opv4-plat")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p

def test_cicd_v4_artifacts() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "production_release"
    assert (root / "runtime.release.summary.json").is_file()
