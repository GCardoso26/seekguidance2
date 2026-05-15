"""Telemetria conectável."""
from app.observability.runtime_exporters import otlp_bridge_runtime_stub


def test_otlp_bridge_payload() -> None:
    p = otlp_bridge_runtime_stub("scope-a")
    assert p["metrics_runtime_summary"] is not None
    assert p["otel_scope"]
