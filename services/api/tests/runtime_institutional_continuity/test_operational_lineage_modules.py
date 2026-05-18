"""test_operational_lineage_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_operational_lineage"
_MODULES = [
    "runtime_operational_lineage_engine_v1",
    "runtime_olin_scoring_v1",
    "runtime_olin_forecasting_v1",
    "runtime_olin_governance_v1",
    "runtime_olin_registry_v1",
    "runtime_olin_heuristics_v1",
    "runtime_olin_balancing_v1",
    "runtime_olin_sustainability_v1",
    "runtime_olin_convergence_v1",
    "runtime_operational_lineage_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_olin_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"olin-{name}")
    assert r["integrity_status"] == "ok"
