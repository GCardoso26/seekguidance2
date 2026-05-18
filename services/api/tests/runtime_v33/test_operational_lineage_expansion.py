"""OLIN expansion."""
import importlib

import pytest

_MODS = [
    "runtime_olin_scoring_v1",
    "runtime_olin_forecasting_v1",
    "runtime_olin_governance_v1",
    "runtime_olin_registry_v1",
    "runtime_olin_heuristics_v1",
    "runtime_olin_balancing_v1",
    "runtime_olin_sustainability_v1",
    "runtime_olin_convergence_v1",
]


@pytest.mark.parametrize("name", _MODS)
def test_olin_expansion(name: str) -> None:
    mod = importlib.import_module(f"app.runtime.runtime_operational_lineage.{name}")
    r = getattr(mod, f'{name}_stub')(f'olin2-{name}')
    assert r["operational_lineage_score"] == 0.94
