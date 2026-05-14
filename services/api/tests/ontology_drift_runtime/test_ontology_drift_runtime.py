"""Ontology drift runtime."""

from __future__ import annotations

from app.observability.live_runtime import ontology_drift_live_runtime_export_stub


def test_ontology_drift_live_export() -> None:
    assert ontology_drift_live_runtime_export_stub("lorcana", 0.2)["drift"] == 0.2
