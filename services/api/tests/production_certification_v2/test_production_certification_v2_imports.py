"""production_certification_v2."""
from __future__ import annotations

from pathlib import Path

from app.runtime.production_certification.runtime_production_certification_summary_v2 import (
    runtime_production_certification_summary_v2_stub,
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


def test_production_certification_v2_payload() -> None:
    p = runtime_production_certification_summary_v2_stub("epv2-cert")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p

def test_production_certification_v2_artifacts() -> None:
    root = Path("generated/runtime_artifacts/production_certification_v2")
    assert (root / "certification.summary.json").is_file()
    assert (root / "certification.integrity.json").is_file()
    assert (root / "certification.replay.json").is_file()
    assert (root / "certification.ha.json").is_file()
