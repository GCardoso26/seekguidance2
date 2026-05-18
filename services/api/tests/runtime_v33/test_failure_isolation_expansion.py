"""FISO expansion."""
import importlib

import pytest

_MODS = [
    "runtime_fiso_scoring_v1",
    "runtime_fiso_forecasting_v1",
    "runtime_fiso_governance_v1",
    "runtime_fiso_registry_v1",
    "runtime_fiso_heuristics_v1",
    "runtime_fiso_balancing_v1",
    "runtime_fiso_sustainability_v1",
    "runtime_fiso_convergence_v1",
]


@pytest.mark.parametrize("name", _MODS)
def test_fiso_expansion(name: str) -> None:
    mod = importlib.import_module(f"app.runtime.runtime_failure_isolation.{name}")
    r = getattr(mod, f'{name}_stub')(f'fiso2-{name}')
    assert r["failure_isolation_score"] == 0.94
