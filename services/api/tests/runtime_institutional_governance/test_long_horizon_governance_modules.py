"""test_long_horizon_governance_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_long_horizon_governance"
_MODULES = [
    "runtime_long_horizon_governance_engine_v1",
    "runtime_lhg_orchestration_v1",
    "runtime_lhg_balancing_v1",
    "runtime_lhg_governance_v1",
    "runtime_lhg_federation_v1",
    "runtime_lhg_observability_v1",
    "runtime_lhg_recovery_v1",
    "runtime_lhg_prioritization_v1",
    "runtime_lhg_convergence_v1",
    "runtime_long_horizon_governance_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_lhg_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"lhg-{name}")
    assert r["integrity_status"] == "ok"
