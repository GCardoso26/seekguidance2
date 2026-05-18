"""test_operational_survivability_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_operational_survivability"
_MODULES = [
    "runtime_operational_survivability_engine_v1",
    "runtime_osv_scoring_v1",
    "runtime_osv_forecasting_v1",
    "runtime_osv_governance_v1",
    "runtime_osv_registry_v1",
    "runtime_osv_heuristics_v1",
    "runtime_osv_balancing_v1",
    "runtime_osv_sustainability_v1",
    "runtime_osv_convergence_v1",
    "runtime_operational_survivability_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_osv_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"osv-{name}")
    assert r["integrity_status"] == "ok"
