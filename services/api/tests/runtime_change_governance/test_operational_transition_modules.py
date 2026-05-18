"""test_operational_transition_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_operational_transition"
_MODULES = [
    "runtime_operational_transition_engine_v1",
    "runtime_opt_scoring_v1",
    "runtime_opt_forecasting_v1",
    "runtime_opt_governance_v1",
    "runtime_opt_registry_v1",
    "runtime_opt_heuristics_v1",
    "runtime_opt_balancing_v1",
    "runtime_opt_sustainability_v1",
    "runtime_opt_convergence_v1",
    "runtime_operational_transition_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_opt_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"opt-{name}")
    assert r["integrity_status"] == "ok"
