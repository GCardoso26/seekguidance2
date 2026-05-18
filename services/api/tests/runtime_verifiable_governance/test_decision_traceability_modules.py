"""test_decision_traceability_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_decision_traceability"
_MODULES = [
    "runtime_decision_traceability_engine_v1",
    "runtime_trace_scoring_v1",
    "runtime_trace_forecasting_v1",
    "runtime_trace_governance_v1",
    "runtime_trace_registry_v1",
    "runtime_trace_heuristics_v1",
    "runtime_trace_balancing_v1",
    "runtime_trace_sustainability_v1",
    "runtime_trace_convergence_v1",
    "runtime_decision_traceability_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_dtr_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"dtr-{name}")
    assert r["integrity_status"] == "ok"
