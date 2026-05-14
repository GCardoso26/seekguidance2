"""Operational confidence (verification)."""

from __future__ import annotations

from app.verification.operational_confidence import (
    branch_explosion_risk,
    graph_reliability_score,
    ontology_integrity_score,
    replay_stability_score,
    runtime_confidence_score,
    semantic_drift_risk,
)


def test_runtime_confidence() -> None:
    s = runtime_confidence_score(tracing_ok=True, dlq_rate=0.01, slo_hits=0.9)
    assert 0.0 < s <= 1.0


def test_replay_stability_score() -> None:
    assert replay_stability_score(deterministic=True, divergence=0.0) > 0.8


def test_semantic_drift() -> None:
    r = semantic_drift_risk(0.5, threshold=0.2)
    assert r["risk"] > 0.0


def test_ontology_and_branch() -> None:
    assert ontology_integrity_score(mapping_conflicts=0, coverage=0.9) > 0.8
    assert branch_explosion_risk(25, 10) > 0.0


def test_graph_reliability() -> None:
    assert graph_reliability_score(kept_ratio=0.9, pressure=0.1) > 0.5
