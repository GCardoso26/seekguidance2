"""test_meta_sandbox_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_meta_sandbox"
_MODULES = [
    "runtime_meta_sandbox_engine_v1",
    "runtime_sandbox_scoring_v1",
    "runtime_sandbox_forecasting_v1",
    "runtime_sandbox_governance_v1",
    "runtime_sandbox_registry_v1",
    "runtime_sandbox_heuristics_v1",
    "runtime_sandbox_balancing_v1",
    "runtime_sandbox_sustainability_v1",
    "runtime_sandbox_convergence_v1",
    "runtime_meta_sandbox_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_san_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"san-{name}")
    assert r["integrity_status"] == "ok"
