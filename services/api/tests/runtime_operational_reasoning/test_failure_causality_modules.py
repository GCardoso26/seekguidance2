"""test_failure_causality_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_failure_causality"
_MODULES = [
    "runtime_failure_causality_engine_v1",
    "runtime_failure_scoring_v1",
    "runtime_failure_forecasting_v1",
    "runtime_failure_governance_v1",
    "runtime_failure_registry_v1",
    "runtime_failure_heuristics_v1",
    "runtime_failure_balancing_v1",
    "runtime_failure_sustainability_v1",
    "runtime_failure_convergence_v1",
    "runtime_failure_causality_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_fca_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"fca-{name}")
    assert r["integrity_status"] == "ok"
