"""Replay determinístico via pipeline V7."""

from __future__ import annotations

from app.reasoning.formal_runtime_v7_pipeline import run_formal_runtime_v7


def test_identical_inputs_same_hash() -> None:
    kw = dict(validated_roles=["layer", "sba"], game_slug="mtg", hits=[], base_confidence=0.85)
    a = run_formal_runtime_v7(**kw)
    b = run_formal_runtime_v7(**kw)
    assert a.deterministic_replay_hash == b.deterministic_replay_hash
