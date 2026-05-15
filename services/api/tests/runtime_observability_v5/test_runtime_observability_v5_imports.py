"""runtime_observability_v5 imports."""

from __future__ import annotations

from app.observability.runtime_exporters import runtime_otel_connector_v3_stub


def test_runtime_observability_v5_payload() -> None:
    p = runtime_otel_connector_v3_stub("scope")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
