"""sustainability_intelligence modules."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.production_sustainability"
_MODULES = [
    "runtime_sustainability_intelligence_engine_v1",
    "runtime_operational_decay_forecasting_v1",
    "runtime_cost_forecasting_v1",
    "runtime_resource_longevity_v1",
    "runtime_operational_efficiency_forecasting_v1",
    "runtime_sustainable_scaling_v1",
    "runtime_operational_capacity_v1",
    "runtime_longterm_pressure_v1",
    "runtime_operational_longevity_v1",
    "runtime_sustainability_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_susi_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    stub = getattr(mod, f"{name}_stub")
    r = stub(f"susi-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
