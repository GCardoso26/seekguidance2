"""test_evolutionary_timeline_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_evolutionary_timeline"
_MODULES = [
    "runtime_evolutionary_timeline_engine_v1",
    "runtime_etl_scoring_v1",
    "runtime_etl_forecasting_v1",
    "runtime_etl_governance_v1",
    "runtime_etl_registry_v1",
    "runtime_etl_heuristics_v1",
    "runtime_etl_balancing_v1",
    "runtime_etl_sustainability_v1",
    "runtime_etl_convergence_v1",
    "runtime_evolutionary_timeline_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_etl_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"etl-{name}")
    assert r["integrity_status"] == "ok"
