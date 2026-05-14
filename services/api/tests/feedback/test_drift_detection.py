"""Testes: drift heuristics."""

from __future__ import annotations

from app.graph.feedback.drift_detection import drift_metrics_bundle, expansion_anomaly_score


def test_expansion_anomaly() -> None:
    assert expansion_anomaly_score(40, 10, 2) > 0.5


def test_drift_metrics_bundle_keys() -> None:
    m = drift_metrics_bundle(
        graph_edges_used=["614->704:x", "614->704:y"],
        graph_candidates=12,
        graph_limit=10,
        final_hits=2,
        confidence=0.5,
        vec_lex_overlap=0.3,
    )
    assert "low_value_edge_hint" in m
