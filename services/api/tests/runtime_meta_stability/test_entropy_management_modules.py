"""entropy management."""
import importlib

import pytest

_PKG = "app.runtime.runtime_entropy_management"
_MODULES = [
    "runtime_entropy_management_engine_v1",
    "runtime_entropy_scoring_v1",
    "runtime_entropy_forecasting_v1",
    "runtime_entropy_governance_v1",
    "runtime_entropy_registry_v1",
    "runtime_entropy_heuristics_v1",
    "runtime_entropy_balancing_v1",
    "runtime_entropy_sustainability_v1",
    "runtime_entropy_convergence_v1",
    "runtime_entropy_management_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_ent_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"ent-{name}")
    assert r["integrity_status"] == "ok"
