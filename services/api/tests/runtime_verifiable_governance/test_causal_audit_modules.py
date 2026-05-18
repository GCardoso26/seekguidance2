"""test_causal_audit_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_causal_audit"
_MODULES = [
    "runtime_causal_audit_engine_v1",
    "runtime_audit_scoring_v1",
    "runtime_audit_forecasting_v1",
    "runtime_audit_governance_v1",
    "runtime_audit_registry_v1",
    "runtime_audit_heuristics_v1",
    "runtime_audit_balancing_v1",
    "runtime_audit_sustainability_v1",
    "runtime_audit_convergence_v1",
    "runtime_causal_audit_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_cau_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"cau-{name}")
    assert r["integrity_status"] == "ok"
