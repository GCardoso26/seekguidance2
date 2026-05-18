"""CMEM expansion."""
import importlib

import pytest

_MODS = [
    "runtime_cmem_scoring_v1",
    "runtime_cmem_forecasting_v1",
    "runtime_cmem_governance_v1",
    "runtime_cmem_registry_v1",
    "runtime_cmem_heuristics_v1",
    "runtime_cmem_balancing_v1",
    "runtime_cmem_sustainability_v1",
    "runtime_cmem_convergence_v1",
]


@pytest.mark.parametrize("name", _MODS)
def test_cmem_expansion(name: str) -> None:
    mod = importlib.import_module(f"app.runtime.runtime_collective_memory.{name}")
    r = getattr(mod, f'{name}_stub')(f'cmem2-{name}')
    assert r["collective_memory_score"] == 0.94
