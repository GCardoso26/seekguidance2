"""test_ecosystem_projection_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_ecosystem_projection"
_MODULES = [
    "runtime_ecosystem_projection_engine_v1",
    "runtime_projection_scoring_v1",
    "runtime_projection_forecasting_v1",
    "runtime_projection_governance_v1",
    "runtime_projection_registry_v1",
    "runtime_projection_heuristics_v1",
    "runtime_projection_balancing_v1",
    "runtime_projection_sustainability_v1",
    "runtime_projection_convergence_v1",
    "runtime_ecosystem_projection_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_pro_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"pro-{name}")
    assert r["integrity_status"] == "ok"
