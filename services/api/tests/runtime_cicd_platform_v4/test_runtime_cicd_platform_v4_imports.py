"""runtime_cicd_platform_v4."""
from __future__ import annotations

from pathlib import Path

from app.api.openapi_runtime_real.runtime_operational_cicd_engine_v4 import (
    runtime_operational_cicd_engine_v4_stub,
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


def test_runtime_cicd_platform_v4_payload() -> None:
    p = runtime_operational_cicd_engine_v4_stub("opv4-ci")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p


def test_production_release_artifacts() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "production_release"
    assert (root / "runtime.release.governance.json").is_file()
