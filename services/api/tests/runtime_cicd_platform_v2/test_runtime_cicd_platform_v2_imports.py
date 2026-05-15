"""runtime_cicd_platform_v2."""
from __future__ import annotations

from pathlib import Path

from app.api.openapi_runtime_real.runtime_operational_cicd_engine_v2 import runtime_operational_cicd_engine_v2_stub

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


def test_runtime_cicd_platform_v2_payload() -> None:
    p = runtime_operational_cicd_engine_v2_stub("opv2-ci")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p

def test_production_cicd_artifacts() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "production_cicd"
    assert (root / "runtime.production.summary.json").is_file()
