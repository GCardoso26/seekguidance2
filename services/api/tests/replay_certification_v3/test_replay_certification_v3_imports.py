"""replay_certification_v3."""
from __future__ import annotations

from pathlib import Path

from app.runtime.replay_certification.replay_certification_engine_v3 import replay_certification_engine_v3_stub

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


def test_replay_certification_v3_payload() -> None:
    p = replay_certification_engine_v3_stub("opv4-cert")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p

def test_certification_v3_artifacts() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "certification_v3"
    assert (root / "runtime.certification.summary.json").is_file()
