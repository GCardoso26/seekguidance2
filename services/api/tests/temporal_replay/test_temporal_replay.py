"""Temporal replay alignment."""

from __future__ import annotations

from app.runtime.replay_stability import replay_temporal_alignment_stub, validate_temporal_monotonic


def test_replay_temporal_alignment() -> None:
    assert replay_temporal_alignment_stub([1, 3, 5])["monotonic"] is True


def test_validate_temporal_monotonic_bridge() -> None:
    assert validate_temporal_monotonic([1, 2])["ok"] is True
