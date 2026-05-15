"""runtime_observability_v6."""
from __future__ import annotations

from app.observability.runtime_exporters.runtime_metrics_buffer_v3 import runtime_metrics_buffer_v3_stub


def test_runtime_observability_v6_payload() -> None:
    p = runtime_metrics_buffer_v3_stub("scope")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
