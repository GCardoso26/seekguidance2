"""test_policy_evolution_v2_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_policy_evolution_v2"
_MODULES = [
    "runtime_policy_evolution_engine_v2",
    "runtime_pev2_scoring_v1",
    "runtime_pev2_forecasting_v1",
    "runtime_pev2_governance_v1",
    "runtime_pev2_registry_v1",
    "runtime_pev2_heuristics_v1",
    "runtime_pev2_balancing_v1",
    "runtime_pev2_sustainability_v1",
    "runtime_pev2_convergence_v1",
    "runtime_policy_evolution_summary_v2",
]


@pytest.mark.parametrize("name", _MODULES)
def test_pev2_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"pev2-{name}")
    assert r["integrity_status"] == "ok"
