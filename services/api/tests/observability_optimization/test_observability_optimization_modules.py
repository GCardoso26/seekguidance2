"""observability optimization modules."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_connected_observability"
_MODULES = [
    "runtime_observability_sampling_optimizer_v1",
    "runtime_observability_retention_optimizer_v1",
    "runtime_metric_compaction_engine_v1",
    "runtime_trace_cost_optimizer_v1",
    "runtime_slo_noise_reduction_v1",
    "runtime_alert_fatigue_engine_v1",
    "runtime_operational_signal_engine_v1",
    "runtime_incident_signal_correlation_v2",
    "runtime_observability_efficiency_engine_v1",
    "runtime_observability_optimization_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_observability_optimization_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    stub = getattr(mod, f"{name}_stub")
    r = stub(f"obs-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0


def test_observability_optimization_summary_engine() -> None:
    from app.runtime.runtime_connected_observability.runtime_observability_optimization_summary_v1 import (
        runtime_observability_optimization_engine_v1,
    )

    out = runtime_observability_optimization_engine_v1("obs-sum")
    assert out["observability_score"] > 0
