"""Stability cross-runtime."""

from __future__ import annotations

from app.stability import cross_tcg_reasoning_stability, cross_version_replay_stability


def test_cross_version() -> None:
    p = {"a": 1}
    assert cross_version_replay_stability(p, p)["stable_hash"] is True


def test_cross_tcg() -> None:
    r = cross_tcg_reasoning_stability("mtg", "yugioh")
    assert r["isolation"] == "soft_normalization"
