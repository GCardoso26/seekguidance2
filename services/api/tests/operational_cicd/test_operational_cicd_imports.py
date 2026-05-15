"""operational_cicd."""
from __future__ import annotations

from pathlib import Path

from app.api.openapi_runtime_real.runtime_operational_cicd_controller_v1 import (
    runtime_operational_cicd_controller_v1_stub,
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


def test_operational_cicd_payload() -> None:
    p = runtime_operational_cicd_controller_v1_stub("pp-ci")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p

def test_production_artifacts() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "production"
    assert (root / "runtime.release.summary.json").is_file()
