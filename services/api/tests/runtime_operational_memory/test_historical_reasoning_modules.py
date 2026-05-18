"""test_historical_reasoning_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_historical_reasoning"
_MODULES = [
    "runtime_historical_reasoning_engine_v1",
    "runtime_hr_scoring_v1",
    "runtime_hr_forecasting_v1",
    "runtime_hr_governance_v1",
    "runtime_hr_registry_v1",
    "runtime_hr_heuristics_v1",
    "runtime_hr_balancing_v1",
    "runtime_hr_sustainability_v1",
    "runtime_hr_convergence_v1",
    "runtime_historical_reasoning_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_his_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"his-{name}")
    assert r["integrity_status"] == "ok"
