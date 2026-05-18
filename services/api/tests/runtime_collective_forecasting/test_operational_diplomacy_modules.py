"""operational diplomacy."""
import importlib

import pytest

_PKG = "app.runtime.runtime_operational_diplomacy"
_MODULES = [
    "runtime_operational_diplomacy_engine_v1",
    "runtime_diplomacy_scoring_v1",
    "runtime_diplomacy_forecasting_v1",
    "runtime_diplomacy_governance_v1",
    "runtime_diplomacy_registry_v1",
    "runtime_diplomacy_heuristics_v1",
    "runtime_diplomacy_balancing_v1",
    "runtime_diplomacy_sustainability_v1",
    "runtime_diplomacy_convergence_v1",
    "runtime_operational_diplomacy_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_dip_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"dip-{name}")
    assert r["integrity_status"] == "ok"
