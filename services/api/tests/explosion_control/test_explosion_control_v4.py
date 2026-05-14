"""Explosion control V4."""

from __future__ import annotations

from app.runtime.explosion_control_v4 import (
    adaptive_equivalence_merge_stub,
    cross_version_convergence_stub,
    multiplayer_branch_cap_stub,
    ontology_compaction_stub,
    predictive_explosion_flags,
    replay_entropy_forecast,
    runtime_emergency_limits,
    semantic_branch_compress_stub,
)


def test_predictive() -> None:
    f = predictive_explosion_flags(
        replay_events=900,
        branches=10,
        ontology_terms=10,
        semantic_spread=0.1,
        temporal_ticks=100,
    )
    assert f["replay_explosion"] is True


def test_entropy_forecast() -> None:
    assert replay_entropy_forecast(0.2)["forecast_risk"] > 0.7


def test_semantic_compress() -> None:
    assert len(semantic_branch_compress_stub(["b", "a", "b"], keep=2)) == 2


def test_ontology_compact() -> None:
    assert ontology_compaction_stub(100, 50) == 50


def test_equivalence_merge() -> None:
    assert adaptive_equivalence_merge_stub(["z", "a", "a"]) == ["a", "z"]


def test_cross_version() -> None:
    assert cross_version_convergence_stub(["h", "h"]) is True


def test_mp_branch() -> None:
    assert multiplayer_branch_cap_stub(100, players=2) < 100


def test_emergency() -> None:
    e = runtime_emergency_limits(freeze_semantic=True, collapse_graph=False)
    assert e["semantic_freeze"] is True
