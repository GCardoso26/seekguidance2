"""DCO expansion."""
import importlib

import pytest

_MODS = [
    "runtime_dco_scoring_v1",
    "runtime_dco_forecasting_v1",
    "runtime_dco_governance_v1",
    "runtime_dco_registry_v1",
    "runtime_dco_heuristics_v1",
    "runtime_dco_balancing_v1",
    "runtime_dco_sustainability_v1",
    "runtime_dco_convergence_v1",
]


@pytest.mark.parametrize("name", _MODS)
def test_dco_expansion(name: str) -> None:
    mod = importlib.import_module(f"app.runtime.runtime_disaster_coordination.{name}")
    r = getattr(mod, f'{name}_stub')(f'dco2-{name}')
    assert r["disaster_coordination_score"] == 0.94
