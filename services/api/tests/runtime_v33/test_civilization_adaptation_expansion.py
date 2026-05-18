"""Civilization adaptation expansion."""
import importlib

import pytest

_MODS = [
    "runtime_adaptive_multi_runtime_equilibrium_v1",
    "runtime_distributed_institutional_coord_v1",
    "runtime_inter_ecosystem_alignment_v1",
    "runtime_civilizational_operational_stability_v1",
    "runtime_resilient_degradable_coord_v1",
]


@pytest.mark.parametrize("name", _MODS)
def test_cad_expansion(name: str) -> None:
    mod = importlib.import_module(f"app.runtime.runtime_civilization_coordination.{name}")
    r = getattr(mod, f'{name}_stub')(f'cad2-{name}')
    assert r["integrity_status"] == "ok"
