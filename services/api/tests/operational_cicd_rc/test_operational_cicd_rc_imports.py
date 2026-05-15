"""operational_cicd_rc."""
from __future__ import annotations

from pathlib import Path

from app.api.openapi_runtime_real.runtime_operational_cicd_pipeline_v4 import runtime_operational_cicd_pipeline_v4_stub

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "divergence_summary",
    "operational_notes",
    "replay_summary",
    "governance_summary",
)


def test_operational_cicd_rc_payload() -> None:
    p = runtime_operational_cicd_pipeline_v4_stub("rc-ci")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p

def test_rc_artifacts() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "release_candidate"
    assert (root / "runtime.release.summary.json").is_file()
