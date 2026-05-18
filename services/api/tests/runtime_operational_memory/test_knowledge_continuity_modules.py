"""test_knowledge_continuity_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_knowledge_continuity"
_MODULES = [
    "runtime_knowledge_continuity_engine_v1",
    "runtime_kc_scoring_v1",
    "runtime_kc_forecasting_v1",
    "runtime_kc_governance_v1",
    "runtime_kc_registry_v1",
    "runtime_kc_heuristics_v1",
    "runtime_kc_balancing_v1",
    "runtime_kc_sustainability_v1",
    "runtime_kc_convergence_v1",
    "runtime_knowledge_continuity_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_knc_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"knc-{name}")
    assert r["integrity_status"] == "ok"
