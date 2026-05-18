"""test_human_feedback_mesh_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_human_feedback_mesh"
_MODULES = [
    "runtime_human_feedback_mesh_engine_v1",
    "runtime_feedback_scoring_v1",
    "runtime_feedback_forecasting_v1",
    "runtime_feedback_governance_v1",
    "runtime_feedback_registry_v1",
    "runtime_feedback_heuristics_v1",
    "runtime_feedback_balancing_v1",
    "runtime_feedback_sustainability_v1",
    "runtime_feedback_convergence_v1",
    "runtime_human_feedback_mesh_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_hfm_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"hfm-{name}")
    assert r["integrity_status"] == "ok"
