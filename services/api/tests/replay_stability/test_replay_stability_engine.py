"""Replay stability package."""

from __future__ import annotations

from app.runtime.replay_stability import (
    merge_equivalent_branches,
    replay_compaction_report,
    replay_consistency_score,
    replay_lineage_stub,
    validate_temporal_monotonic,
)


def test_compaction_report() -> None:
    events = [{"a": 1}, {"a": 1}, {"b": 2}]
    r = replay_compaction_report(events, max_events=10)
    assert r["meta"]["unique"] == 2


def test_merge_branches() -> None:
    m = merge_equivalent_branches([{"x": 1}, {"x": 1}])
    assert m["unique"] == 1


def test_temporal() -> None:
    assert validate_temporal_monotonic([1, 2, 2])["ok"] is True
    assert validate_temporal_monotonic([2, 1])["ok"] is False


def test_consistency_score() -> None:
    s = replay_consistency_score(deterministic_runs_match=True, hash_stable=True)
    assert s == 1.0


def test_replay_lineage() -> None:
    assert replay_lineage_stub("rid", parents=["p0"])["replay_id"] == "rid"


