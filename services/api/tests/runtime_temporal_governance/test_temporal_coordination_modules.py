"""test_temporal_coordination_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_temporal_coordination"
_MODULES = [
    "runtime_temporal_coordination_engine_v1",
    "runtime_tco_orchestration_v1",
    "runtime_tco_balancing_v1",
    "runtime_tco_governance_v1",
    "runtime_tco_registry_v1",
    "runtime_tco_heuristics_v1",
    "runtime_tco_synchronization_v1",
    "runtime_tco_sustainability_v1",
    "runtime_tco_convergence_v1",
    "runtime_temporal_coordination_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_tco_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"tco-{name}")
    assert r["integrity_status"] == "ok"
