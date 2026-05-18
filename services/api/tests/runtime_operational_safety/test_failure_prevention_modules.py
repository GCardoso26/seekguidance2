"""test_failure_prevention_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_failure_prevention"
_MODULES = [
    "runtime_failure_prevention_engine_v1",
    "runtime_prevention_scoring_v1",
    "runtime_prevention_forecasting_v1",
    "runtime_prevention_governance_v1",
    "runtime_prevention_registry_v1",
    "runtime_prevention_heuristics_v1",
    "runtime_prevention_balancing_v1",
    "runtime_prevention_sustainability_v1",
    "runtime_prevention_convergence_v1",
    "runtime_failure_prevention_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_fpv_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"fpv-{name}")
    assert r["integrity_status"] == "ok"
