"""test_governance_revision_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_governance_revision"
_MODULES = [
    "runtime_governance_revision_engine_v1",
    "runtime_grev_scoring_v1",
    "runtime_grev_forecasting_v1",
    "runtime_grev_governance_v1",
    "runtime_grev_registry_v1",
    "runtime_grev_heuristics_v1",
    "runtime_grev_balancing_v1",
    "runtime_grev_sustainability_v1",
    "runtime_grev_convergence_v1",
    "runtime_governance_revision_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_grev_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"grev-{name}")
    assert r["integrity_status"] == "ok"
