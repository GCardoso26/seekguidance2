"""Continuous eval V2 + reasoning multiplayer."""

from __future__ import annotations

from app.evaluation.continuous import (
    cross_tcg_consistency_index,
    deterministic_legality_gate,
    ontology_drift_series,
    operational_health_bundle,
    replay_instability_index,
    semantic_regression_snapshot,
)
from app.reasoning.multiplayer import (
    resolve_simultaneous_actions,
    shared_resource_conflict_flags,
    validate_apnap_order,
)


def test_semantic_regression() -> None:
    assert semantic_regression_snapshot(drift_score=0.9)["regression"] is True


def test_ontology_series() -> None:
    s = ontology_drift_series([0.1, 0.3])
    assert s["trend"] == "up"


def test_cross_tcg() -> None:
    c = cross_tcg_consistency_index({"a": 0.9, "b": 0.5})
    assert c["spread"] == 0.4


def test_operational_health() -> None:
    b = operational_health_bundle(cpu=0.2, mem=0.3)
    assert "cpu" in b["parts"]


def test_replay_instability() -> None:
    assert replay_instability_index(0.8) == 0.8


def test_legality_gate() -> None:
    assert deterministic_legality_gate("s", "h")["stable"] is True


def test_multiplayer_facade() -> None:
    out = resolve_simultaneous_actions([{"player": "b"}, {"player": "a"}])
    assert out[0]["player"] == "a"
    v = validate_apnap_order("p1", ["p2"], ["p1", "p2"])
    assert v["ok"] is True
    f = shared_resource_conflict_flags(
        [{"resource_id": "r1", "player": "a"}, {"resource_id": "r1", "player": "b"}],
    )
    assert f["ok"] is False
