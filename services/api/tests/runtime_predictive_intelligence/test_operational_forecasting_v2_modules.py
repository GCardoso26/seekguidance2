"""test_operational_forecasting_v2_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_operational_forecasting_v2"
_MODULES = [
    "runtime_operational_forecasting_engine_v2",
    "runtime_of2_scoring_v1",
    "runtime_of2_forecasting_v1",
    "runtime_of2_governance_v1",
    "runtime_of2_registry_v1",
    "runtime_of2_heuristics_v1",
    "runtime_of2_balancing_v1",
    "runtime_of2_sustainability_v1",
    "runtime_of2_convergence_v1",
    "runtime_operational_forecasting_summary_v2",
]


@pytest.mark.parametrize("name", _MODULES)
def test_of2_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"of2-{name}")
    assert r["integrity_status"] == "ok"
