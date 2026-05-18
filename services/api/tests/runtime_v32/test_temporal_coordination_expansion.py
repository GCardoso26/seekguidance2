"""TCO expansion."""
import importlib

import pytest

_MODS = [
    "runtime_tco_orchestration_v1",
    "runtime_tco_balancing_v1",
    "runtime_tco_governance_v1",
    "runtime_tco_registry_v1",
    "runtime_tco_heuristics_v1",
    "runtime_tco_synchronization_v1",
    "runtime_tco_sustainability_v1",
    "runtime_tco_convergence_v1",
]


@pytest.mark.parametrize("name", _MODS)
def test_tco_expansion(name: str) -> None:
    mod = importlib.import_module(f"app.runtime.runtime_temporal_coordination.{name}")
    r = getattr(mod, f'{name}_stub')(f'tco2-{name}')
    assert r["temporal_coordination_score"] == 0.94
