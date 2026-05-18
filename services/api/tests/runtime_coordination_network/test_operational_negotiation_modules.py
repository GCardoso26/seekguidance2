"""operational negotiation."""
import importlib

import pytest

_PKG = "app.runtime.runtime_operational_negotiation"
_MODULES = [
    "runtime_operational_negotiation_engine_v1",
    "runtime_negotiation_heuristics_v1",
    "runtime_negotiation_scoring_v1",
    "runtime_negotiation_forecasting_v1",
    "runtime_negotiation_governance_v1",
    "runtime_negotiation_registry_v1",
    "runtime_negotiation_balancing_v1",
    "runtime_negotiation_sustainability_v1",
    "runtime_negotiation_convergence_v1",
    "runtime_operational_negotiation_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_neg_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"neg-{name}")
    assert r["integrity_status"] == "ok"
