"""Diagnostics reais de federation."""

from __future__ import annotations

from app.runtime.replay_federation import federation_runtime_diagnostics_stub


def test_federation_diagnostics_scoring() -> None:
    d = federation_runtime_diagnostics_stub("c1")
    assert d["operational_pressure_score"] >= 0
    assert "replay_cluster_health" in d
