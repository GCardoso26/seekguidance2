"""test_evolution_control_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_evolution_control"
_MODULES = [
    "runtime_evolution_control_engine_v1",
    "runtime_evc_scoring_v1",
    "runtime_evc_forecasting_v1",
    "runtime_evc_governance_v1",
    "runtime_evc_registry_v1",
    "runtime_evc_heuristics_v1",
    "runtime_evc_balancing_v1",
    "runtime_evc_sustainability_v1",
    "runtime_evc_convergence_v1",
    "runtime_evolution_control_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_evc_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"evc-{name}")
    assert r["integrity_status"] == "ok"
