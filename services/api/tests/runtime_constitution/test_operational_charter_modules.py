"""test_operational_charter_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_operational_charter"
_MODULES = [
    "runtime_operational_charter_engine_v1",
    "runtime_charter_scoring_v1",
    "runtime_charter_forecasting_v1",
    "runtime_charter_governance_v1",
    "runtime_charter_registry_v1",
    "runtime_charter_heuristics_v1",
    "runtime_charter_balancing_v1",
    "runtime_charter_sustainability_v1",
    "runtime_charter_convergence_v1",
    "runtime_operational_charter_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_cha_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"cha-{name}")
    assert r["integrity_status"] == "ok"
