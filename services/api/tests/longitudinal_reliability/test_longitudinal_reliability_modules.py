"""longitudinal_reliability modules."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.production_sustainability"
_MODULES = [
    "runtime_longitudinal_reliability_engine_v1",
    "runtime_operational_decay_runtime_v1",
    "runtime_reliability_trend_runtime_v1",
    "runtime_slo_longitudinal_runtime_v1",
    "runtime_operational_regression_runtime_v1",
    "runtime_stability_forecasting_runtime_v1",
    "runtime_runtime_pressure_trend_v1",
    "runtime_failure_pattern_runtime_v1",
    "runtime_recovery_efficiency_runtime_v1",
    "runtime_longitudinal_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_long_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    stub = getattr(mod, f"{name}_stub")
    r = stub(f"long-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0


def test_longitudinal_engine() -> None:
    from app.runtime.production_sustainability.runtime_longitudinal_summary_v1 import (
        runtime_longitudinal_reliability_engine_v1,
    )

    assert runtime_longitudinal_reliability_engine_v1("long-sum")["longitudinal_score"] > 0
