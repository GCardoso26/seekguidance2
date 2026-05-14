"""Explosion control V2."""

from __future__ import annotations

from app.runtime.explosion_control_v2 import (
    adaptive_graph_collapse,
    adaptive_prune_decision,
    collapse_symbolic_paths,
    compact_replay_hashes,
    convergence_prediction,
    graph_entropy_pressure,
    ontology_entropy_limits,
    ontology_prune_hint,
    replay_entropy_bounds,
    semantic_branch_limit,
    semantic_divergence_prediction,
    temporal_branch_compaction,
    temporal_drift_bound,
)


def test_adaptive_prune() -> None:
    d = adaptive_prune_decision(
        confidence=0.4,
        token_budget=100,
        tokens_used=200,
        replay_stability=0.9,
        graph_pressure=0.1,
    )
    assert d["prune"] is True


def test_semantic_branch_limit() -> None:
    assert semantic_branch_limit(100, confidence=0.0, hard_cap=20) <= 20


def test_replay_compaction() -> None:
    h = compact_replay_hashes(["a", "a", "b"], max_keep=10)
    assert h == ["a", "b"]


def test_symbolic_collapse() -> None:
    out = collapse_symbolic_paths([["z", "a"], ["a", "z"]])
    assert len(out) == 1


def test_temporal_and_ontology() -> None:
    assert temporal_drift_bound(600.0)["ok"] is False
    assert ontology_prune_hint(0.9)["prune"] is True


def test_entropy() -> None:
    assert graph_entropy_pressure(1, 4) > 0.5


def test_v3_helpers() -> None:
    assert replay_entropy_bounds(0.2)["within_bounds"] is True
    assert semantic_divergence_prediction(0.9, 0.2) == 0.7
    assert adaptive_graph_collapse(100, 20) < 100
    assert temporal_branch_compaction([(2, "a"), (1, "b")])[0] == (1, "b")
    assert convergence_prediction(0.2, 0.9)["likely"] is True
    assert ontology_entropy_limits(500)["over_soft_cap"] is True
