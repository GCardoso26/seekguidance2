"""test_historical_continuity_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_historical_continuity"
_MODULES = [
    "runtime_historical_continuity_engine_v1",
    "runtime_hic_scoring_v1",
    "runtime_hic_forecasting_v1",
    "runtime_hic_governance_v1",
    "runtime_hic_registry_v1",
    "runtime_hic_heuristics_v1",
    "runtime_hic_balancing_v1",
    "runtime_hic_sustainability_v1",
    "runtime_hic_convergence_v1",
    "runtime_historical_continuity_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_hic_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"hic-{name}")
    assert r["integrity_status"] == "ok"
