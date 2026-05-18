"""test_operational_validation_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_operational_validation"
_MODULES = [
    "runtime_operational_validation_engine_v1",
    "runtime_validation_scoring_v1",
    "runtime_validation_forecasting_v1",
    "runtime_validation_governance_v1",
    "runtime_validation_registry_v1",
    "runtime_validation_heuristics_v1",
    "runtime_validation_balancing_v1",
    "runtime_validation_sustainability_v1",
    "runtime_validation_convergence_v1",
    "runtime_operational_validation_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_val_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"val-{name}")
    assert r["integrity_status"] == "ok"
