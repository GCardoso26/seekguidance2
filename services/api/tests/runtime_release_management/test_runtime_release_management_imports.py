"""runtime_release_management."""
from __future__ import annotations

from pathlib import Path

from app.api.openapi_runtime_real.runtime_release_management_v1 import runtime_release_management_v1_stub

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


def test_runtime_release_management_payload() -> None:
    p = runtime_release_management_v1_stub("epv1-rel")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p

def test_external_pilot_release_artifacts() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "external_pilot"
    assert (root / "runtime.release.summary.json").is_file()
    assert (root / "runtime.release.enterprise.json").is_file()
