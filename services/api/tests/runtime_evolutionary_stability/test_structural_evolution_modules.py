"""test_structural_evolution_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_structural_evolution"
_MODULES = [
    "runtime_structural_evolution_engine_v1",
    "runtime_sev_scoring_v1",
    "runtime_sev_forecasting_v1",
    "runtime_sev_governance_v1",
    "runtime_sev_registry_v1",
    "runtime_sev_heuristics_v1",
    "runtime_sev_balancing_v1",
    "runtime_sev_sustainability_v1",
    "runtime_sev_convergence_v1",
    "runtime_structural_evolution_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_sev_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"sev-{name}")
    assert r["integrity_status"] == "ok"
