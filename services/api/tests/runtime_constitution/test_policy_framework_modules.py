"""test_policy_framework_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_policy_framework"
_MODULES = [
    "runtime_policy_framework_engine_v1",
    "runtime_framework_scoring_v1",
    "runtime_framework_forecasting_v1",
    "runtime_framework_governance_v1",
    "runtime_framework_registry_v1",
    "runtime_framework_heuristics_v1",
    "runtime_framework_balancing_v1",
    "runtime_framework_sustainability_v1",
    "runtime_framework_convergence_v1",
    "runtime_policy_framework_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_pol_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"pol-{name}")
    assert r["integrity_status"] == "ok"
