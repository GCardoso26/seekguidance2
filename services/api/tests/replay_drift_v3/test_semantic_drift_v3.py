"""Drift v3."""

from __future__ import annotations

from app.runtime.replay_diagnostics_v2 import semantic_replay_drift_v3_stub


def test_semantic_drift_v3() -> None:
    p = semantic_replay_drift_v3_stub("d3")
    assert p["replay_drift_score"] >= 0
