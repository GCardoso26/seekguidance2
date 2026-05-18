"""test_causal_modeling_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_causal_modeling"
_MODULES = [
    "runtime_causal_modeling_engine_v1",
    "runtime_modeling_scoring_v1",
    "runtime_modeling_forecasting_v1",
    "runtime_modeling_governance_v1",
    "runtime_modeling_registry_v1",
    "runtime_modeling_heuristics_v1",
    "runtime_modeling_balancing_v1",
    "runtime_modeling_sustainability_v1",
    "runtime_modeling_convergence_v1",
    "runtime_causal_modeling_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_cmo_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"cmo-{name}")
    assert r["integrity_status"] == "ok"
