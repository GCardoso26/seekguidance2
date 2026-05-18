"""test_governance_continuity_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_governance_continuity"
_MODULES = [
    "runtime_governance_continuity_engine_v1",
    "runtime_gc_scoring_v1",
    "runtime_gc_forecasting_v1",
    "runtime_gc_governance_v1",
    "runtime_gc_registry_v1",
    "runtime_gc_heuristics_v1",
    "runtime_gc_balancing_v1",
    "runtime_gc_sustainability_v1",
    "runtime_gc_convergence_v1",
    "runtime_governance_continuity_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_gcn_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"gcn-{name}")
    assert r["integrity_status"] == "ok"
