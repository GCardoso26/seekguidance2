"""stewardship v2 modules."""
import importlib

import pytest

_PKG = "app.runtime.runtime_stewardship"
_MODULES = [
    "runtime_long_term_stewardship_engine_v2",
    "runtime_stewardship_lifecycle_v1",
    "runtime_sustainability_governance_forecast_v1",
    "runtime_evolution_continuity_v1",
    "runtime_ecosystem_stewardship_maturity_v1",
    "runtime_governance_sustainability_v1",
    "runtime_ecosystem_continuity_v1",
    "runtime_stewardship_forecasting_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_stw2_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"stw2-{name}")
    assert r["integrity_status"] == "ok"
