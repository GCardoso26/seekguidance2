"""openapi_cicd_v3."""
from __future__ import annotations

from pathlib import Path

from app.api.openapi_runtime_real.runtime_openapi_enforcement_v10 import runtime_openapi_enforcement_v10_stub

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "divergence_summary",
    "operational_notes",
    "replay_summary",
    "governance_summary",
)

def test_openapi_cicd_v3_payload() -> None:
    p = runtime_openapi_enforcement_v10_stub("run10")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p

def test_cicd_artifacts_v10() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts"
    assert (root / "cicd" / "runtime.cicd.operational.json").is_file()
