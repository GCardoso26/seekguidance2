"""Replay explosion control."""

from __future__ import annotations

from app.runtime.replay.replay_explosion_control import replay_dedupe_events, replay_equivalence_collapse


def test_dedupe() -> None:
    ev = [{"a": 1}, {"a": 1}, {"b": 2}]
    out, meta = replay_dedupe_events(ev, max_events=10)
    assert meta["unique"] == 2


def test_collapse() -> None:
    p = [{"x": 1}, {"x": 1}]
    r = replay_equivalence_collapse(p)
    assert r["collapsed"] == 1
