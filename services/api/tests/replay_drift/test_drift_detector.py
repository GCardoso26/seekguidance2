"""Replay drift detector."""

from __future__ import annotations

from app.runtime.replay_diagnostics_v2 import replay_drift_detector_v2_stub


def test_drift_detector() -> None:
    p = replay_drift_detector_v2_stub("d1")
    assert "replay_drift_summary" in p
    assert p["divergence_score"] >= 0
