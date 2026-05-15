"""Federation divergence."""

from __future__ import annotations

from app.runtime.replay_federation import federation_divergence_detector_stub


def test_federation_divergence() -> None:
    p = federation_divergence_detector_stub("fed-1")
    assert p["distributed_alignment_score"] > 0
