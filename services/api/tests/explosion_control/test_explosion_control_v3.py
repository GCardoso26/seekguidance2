"""Explosion control V3."""

from __future__ import annotations

from app.runtime.explosion_control_v3 import (
    adaptive_pruning_runtime_bundle,
    deterministic_convergence_ok,
    graph_entropy_v3,
    replay_compaction_v2,
    runtime_safety_caps,
    semantic_divergence_cap,
)
from app.runtime.explosion_control_v3.cross_version_collapse import cross_version_collapse
from app.runtime.explosion_control_v3.ontology_growth_control import ontology_growth_control
from app.runtime.explosion_control_v3.symbolic_branch_prediction import symbolic_branch_prediction
from app.runtime.explosion_control_v3.temporal_branch_merge import temporal_branch_merge


def test_graph_entropy_v3() -> None:
    assert graph_entropy_v3(2, 10)["pressure"] > 0


def test_replay_compaction_v2() -> None:
    ev, _m = replay_compaction_v2([{"a": 1}, {"a": 1}], max_events=5)
    assert len(ev) == 1


def test_caps() -> None:
    c = runtime_safety_caps(branch=300, graph=2000, replay_depth=100)
    assert c["emergency_collapse"] is True


def test_cross_version() -> None:
    assert cross_version_collapse(["b", "a", "b"]) == ["a", "b"]


def test_temporal_merge() -> None:
    assert temporal_branch_merge([(2, "x"), (1, "y")])[0] == (1, "y")


def test_symbolic_pred() -> None:
    assert symbolic_branch_prediction(50, 10)["over"] is True


def test_ontology_growth() -> None:
    assert ontology_growth_control(1000, cap=100)["prune"] is True


def test_semantic_cap() -> None:
    assert semantic_divergence_cap(0.3)["within"] is True


def test_convergence() -> None:
    assert deterministic_convergence_ok(["a", "a"]) is True


def test_adaptive_runtime() -> None:
    d = adaptive_pruning_runtime_bundle(
        confidence=0.1,
        token_budget=10,
        tokens_used=20,
        replay_stability=0.9,
        graph_pressure=0.1,
    )
    assert d["prune"] is True
