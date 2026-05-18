"""test_human_governance_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_human_governance"
_MODULES = [
    "runtime_human_governance_engine_v1",
    "runtime_hgv_scoring_v1",
    "runtime_hgv_forecasting_v1",
    "runtime_hgv_governance_v1",
    "runtime_hgv_registry_v1",
    "runtime_hgv_heuristics_v1",
    "runtime_hgv_balancing_v1",
    "runtime_hgv_sustainability_v1",
    "runtime_hgv_convergence_v1",
    "runtime_human_governance_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_hgv_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"hgv-{name}")
    assert r["integrity_status"] == "ok"
