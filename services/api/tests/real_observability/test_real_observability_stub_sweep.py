"""real_observability stub sweep."""
from __future__ import annotations

from app.runtime.runtime_connected_observability.runtime_real_otlp_connector_v1 import (
    runtime_real_otlp_connector_v1_stub,
)
from app.runtime.runtime_connected_observability.runtime_real_prometheus_exporter_v1 import (
    runtime_real_prometheus_exporter_v1_stub,
)


def test_real_observability_sweep() -> None:
    p_runtime = runtime_real_otlp_connector_v1_stub("ga30-sweep")
    assert p_runtime["runtime_confidence"] > 0
    p_runtime = runtime_real_prometheus_exporter_v1_stub("ga30-sweep")
    assert p_runtime["runtime_confidence"] > 0
