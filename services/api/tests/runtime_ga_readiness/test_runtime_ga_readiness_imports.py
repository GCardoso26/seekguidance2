"""runtime_ga_readiness."""
from __future__ import annotations

from pathlib import Path

from app.runtime.platform_ga_readiness.runtime_ga_platform_summary_v1 import runtime_ga_platform_summary_v1_stub

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


def test_runtime_ga_readiness_payload() -> None:
    p = runtime_ga_platform_summary_v1_stub("ga30-ga")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p

def test_ga_readiness_artifacts() -> None:
    root = Path("generated/runtime_artifacts/ga_readiness")
    assert (root / "ga.summary.json").is_file()
    assert (root / "ga.canonical.json").is_file()
    assert (root / "ga.public_api.json").is_file()
