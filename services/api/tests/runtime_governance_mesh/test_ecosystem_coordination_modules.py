"""ecosystem coordination."""
import importlib

import pytest

_PKG = "app.runtime.runtime_ecosystem_coordination"
_MODULES = [
    "runtime_ecosystem_coordination_engine_v1",
    "runtime_ecosystem_policy_coord_v1",
    "runtime_ecosystem_release_coord_v1",
    "runtime_ecosystem_governance_intel_v1",
    "runtime_ecosystem_maturity_forecast_v1",
    "runtime_ecosystem_harmonization_v1",
    "runtime_ecosystem_convergence_v1",
    "runtime_ecosystem_visibility_v1",
    "runtime_ecosystem_stability_bridge_v1",
    "runtime_ecosystem_coordination_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_ecocoord_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"eco-{name}")
    assert r["integrity_status"] == "ok"
