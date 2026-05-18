"""test_risk_coordination_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_risk_coordination"
_MODULES = [
    "runtime_risk_coordination_engine_v1",
    "runtime_risk_scoring_v1",
    "runtime_risk_forecasting_v1",
    "runtime_risk_governance_v1",
    "runtime_risk_registry_v1",
    "runtime_risk_heuristics_v1",
    "runtime_risk_balancing_v1",
    "runtime_risk_sustainability_v1",
    "runtime_risk_convergence_v1",
    "runtime_risk_coordination_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_rsk_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"rsk-{name}")
    assert r["integrity_status"] == "ok"
