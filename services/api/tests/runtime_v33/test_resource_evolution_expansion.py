"""Resource evolution expansion."""
import importlib

import pytest

_MODS = [
    "runtime_footprint_evolution_v1",
    "runtime_cost_prediction_v1",
    "runtime_dynamic_capacity_adaptation_v1",
    "runtime_sustainable_tuning_v1",
    "runtime_longitudinal_efficiency_v1",
]


@pytest.mark.parametrize("name", _MODS)
def test_rev_expansion(name: str) -> None:
    mod = importlib.import_module(f"app.runtime.production_sustainability.{name}")
    r = getattr(mod, f'{name}_stub')(f'rev2-{name}')
    assert r["resource_evolution_score"] == 0.94
