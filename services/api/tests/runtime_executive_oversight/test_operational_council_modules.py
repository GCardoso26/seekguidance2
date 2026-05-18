"""test_operational_council_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_operational_council"
_MODULES = [
    "runtime_operational_council_engine_v1",
    "runtime_cou_scoring_v1",
    "runtime_cou_forecasting_v1",
    "runtime_cou_governance_v1",
    "runtime_cou_registry_v1",
    "runtime_cou_heuristics_v1",
    "runtime_cou_balancing_v1",
    "runtime_cou_sustainability_v1",
    "runtime_cou_convergence_v1",
    "runtime_operational_council_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_cou_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"cou-{name}")
    assert r["integrity_status"] == "ok"
