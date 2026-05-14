"""Replay runtime (estabilidade + recovery)."""

from __future__ import annotations

from app.runtime.replay_stability import replay_hash_verification_stub, replay_integrity_stub


def test_replay_integrity() -> None:
    assert replay_integrity_stub("x", "x")["ok"] is True


def test_replay_hash() -> None:
    assert replay_hash_verification_stub("a", "a")["match"] is True
