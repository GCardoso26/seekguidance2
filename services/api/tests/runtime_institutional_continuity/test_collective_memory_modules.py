"""test_collective_memory_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_collective_memory"
_MODULES = [
    "runtime_collective_memory_engine_v1",
    "runtime_cmem_scoring_v1",
    "runtime_cmem_forecasting_v1",
    "runtime_cmem_governance_v1",
    "runtime_cmem_registry_v1",
    "runtime_cmem_heuristics_v1",
    "runtime_cmem_balancing_v1",
    "runtime_cmem_sustainability_v1",
    "runtime_cmem_convergence_v1",
    "runtime_collective_memory_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_cmem_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"cmem-{name}")
    assert r["integrity_status"] == "ok"
