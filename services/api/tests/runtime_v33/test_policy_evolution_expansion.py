"""PEV2 expansion."""
import importlib

import pytest

_MODS = [
    "runtime_pev2_scoring_v1",
    "runtime_pev2_forecasting_v1",
    "runtime_pev2_governance_v1",
    "runtime_pev2_registry_v1",
    "runtime_pev2_heuristics_v1",
    "runtime_pev2_balancing_v1",
    "runtime_pev2_sustainability_v1",
    "runtime_pev2_convergence_v1",
]


@pytest.mark.parametrize("name", _MODS)
def test_pev2_expansion(name: str) -> None:
    mod = importlib.import_module(f"app.runtime.runtime_policy_evolution_v2.{name}")
    r = getattr(mod, f'{name}_stub')(f'pev22-{name}')
    assert r["policy_evolution_score"] == 0.94
