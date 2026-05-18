"""OF2 expansion."""
import importlib

import pytest

_MODS = [
    "runtime_of2_scoring_v1",
    "runtime_of2_forecasting_v1",
    "runtime_of2_governance_v1",
    "runtime_of2_registry_v1",
    "runtime_of2_heuristics_v1",
    "runtime_of2_balancing_v1",
    "runtime_of2_sustainability_v1",
    "runtime_of2_convergence_v1",
]


@pytest.mark.parametrize("name", _MODS)
def test_of2_expansion(name: str) -> None:
    mod = importlib.import_module(f"app.runtime.runtime_operational_forecasting_v2.{name}")
    r = getattr(mod, f'{name}_stub')(f'of22-{name}')
    assert r["operational_forecasting_score"] == 0.94
