"""test_longitudinal_state_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_longitudinal_state"
_MODULES = [
    "runtime_longitudinal_state_engine_v1",
    "runtime_lst_scoring_v1",
    "runtime_lst_forecasting_v1",
    "runtime_lst_governance_v1",
    "runtime_lst_registry_v1",
    "runtime_lst_heuristics_v1",
    "runtime_lst_balancing_v1",
    "runtime_lst_sustainability_v1",
    "runtime_lst_convergence_v1",
    "runtime_longitudinal_state_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_lst_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"lst-{name}")
    assert r["integrity_status"] == "ok"
