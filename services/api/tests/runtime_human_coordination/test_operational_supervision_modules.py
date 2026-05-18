"""test_operational_supervision_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_operational_supervision"
_MODULES = [
    "runtime_operational_supervision_engine_v1",
    "runtime_supervision_scoring_v1",
    "runtime_supervision_forecasting_v1",
    "runtime_supervision_governance_v1",
    "runtime_supervision_registry_v1",
    "runtime_supervision_heuristics_v1",
    "runtime_supervision_balancing_v1",
    "runtime_supervision_sustainability_v1",
    "runtime_supervision_convergence_v1",
    "runtime_operational_supervision_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_sup_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"sup-{name}")
    assert r["integrity_status"] == "ok"
