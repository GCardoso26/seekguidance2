"""test_disaster_coordination_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_disaster_coordination"
_MODULES = [
    "runtime_disaster_coordination_engine_v1",
    "runtime_dco_scoring_v1",
    "runtime_dco_forecasting_v1",
    "runtime_dco_governance_v1",
    "runtime_dco_registry_v1",
    "runtime_dco_heuristics_v1",
    "runtime_dco_balancing_v1",
    "runtime_dco_sustainability_v1",
    "runtime_dco_convergence_v1",
    "runtime_disaster_coordination_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_dco_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"dco-{name}")
    assert r["integrity_status"] == "ok"
