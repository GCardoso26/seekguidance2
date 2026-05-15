"""OTLP connector v2."""

from __future__ import annotations

from app.observability.runtime_exporters import otlp_runtime_connector_v2_stub


def test_otlp_connector_graceful() -> None:
    p = otlp_runtime_connector_v2_stub("otel-1")
    assert p["observability_health"]["nominal"] is True
