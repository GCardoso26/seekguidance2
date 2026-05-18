"""GREV expansion."""
import importlib

import pytest

_MODS = [
    "runtime_grev_scoring_v1",
    "runtime_grev_forecasting_v1",
    "runtime_grev_governance_v1",
    "runtime_grev_registry_v1",
    "runtime_grev_heuristics_v1",
    "runtime_grev_balancing_v1",
    "runtime_grev_sustainability_v1",
    "runtime_grev_convergence_v1",
]


@pytest.mark.parametrize("name", _MODS)
def test_grev_expansion(name: str) -> None:
    mod = importlib.import_module(f"app.runtime.runtime_governance_revision.{name}")
    r = getattr(mod, f'{name}_stub')(f'grev2-{name}')
    assert r["governance_revision_score"] == 0.94
