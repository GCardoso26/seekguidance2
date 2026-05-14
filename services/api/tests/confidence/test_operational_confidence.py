"""Operational confidence."""

from __future__ import annotations

from app.confidence import operational_confidence_bundle


def test_bundle() -> None:
    b = operational_confidence_bundle(retrieval_conf=0.8, graph_conf=0.7, replay_conf=0.9, cross_tcg_penalty=0.1)
    assert 0 <= b["score"] <= 1
