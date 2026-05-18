"""test_failure_absorption_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_failure_absorption"
_MODULES = [
    "runtime_failure_absorption_engine_v1",
    "runtime_fab_scoring_v1",
    "runtime_fab_forecasting_v1",
    "runtime_fab_governance_v1",
    "runtime_fab_registry_v1",
    "runtime_fab_heuristics_v1",
    "runtime_fab_balancing_v1",
    "runtime_fab_sustainability_v1",
    "runtime_fab_convergence_v1",
    "runtime_failure_absorption_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_fab_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"fab-{name}")
    assert r["integrity_status"] == "ok"
