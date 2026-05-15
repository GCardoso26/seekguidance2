"""Replay drift v2."""

from __future__ import annotations

from app.runtime.replay_diagnostics_v2 import semantic_replay_divergence_v2_stub


def test_semantic_divergence() -> None:
    p = semantic_replay_divergence_v2_stub("d1")
    assert p["replay_drift_score"] >= 0
    assert p["determinism_confidence"] > 0
