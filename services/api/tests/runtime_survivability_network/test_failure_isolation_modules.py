"""test_failure_isolation_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_failure_isolation"
_MODULES = [
    "runtime_failure_isolation_engine_v1",
    "runtime_fiso_scoring_v1",
    "runtime_fiso_forecasting_v1",
    "runtime_fiso_governance_v1",
    "runtime_fiso_registry_v1",
    "runtime_fiso_heuristics_v1",
    "runtime_fiso_balancing_v1",
    "runtime_fiso_sustainability_v1",
    "runtime_fiso_convergence_v1",
    "runtime_failure_isolation_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_fiso_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"fiso-{name}")
    assert r["integrity_status"] == "ok"
