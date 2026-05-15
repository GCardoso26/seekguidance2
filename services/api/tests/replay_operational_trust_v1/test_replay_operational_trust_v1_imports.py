"""replay_operational_trust_v1."""
from __future__ import annotations

from pathlib import Path

from app.runtime.replay_certification.replay_operational_trust_engine_v1 import replay_operational_trust_engine_v1_stub

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


def test_replay_operational_trust_v1_payload() -> None:
    p = replay_operational_trust_engine_v1_stub("cpv3-trust")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p

def test_artifacts() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "trust"
    assert root.is_dir()
