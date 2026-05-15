"""Observability v3."""

from __future__ import annotations

from app.observability.runtime_exporters import operational_metrics_registry_v2_stub


def test_metrics_registry_v2() -> None:
    p = operational_metrics_registry_v2_stub("obs-v3")
    assert p["observability_health"]["nominal"] is True
