"""release_governance_v2."""
from __future__ import annotations

from pathlib import Path

from app.api.openapi_runtime_real.runtime_release_governance_v3 import runtime_release_governance_v3_stub

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


def test_release_governance_v2_payload() -> None:
    p = runtime_release_governance_v3_stub("prov1-rel")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p

def test_production_enterprise_artifacts() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "production_enterprise"
    assert (root / "runtime.release.summary.json").is_file()
    assert (root / "runtime.release.semver.json").is_file()
