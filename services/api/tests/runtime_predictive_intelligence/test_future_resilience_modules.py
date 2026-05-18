"""test_future_resilience_modules.py."""
import importlib

import pytest

_PKG = "app.runtime.runtime_future_resilience"
_MODULES = [
    "runtime_future_resilience_engine_v1",
    "runtime_fres_scoring_v1",
    "runtime_fres_forecasting_v1",
    "runtime_fres_governance_v1",
    "runtime_fres_registry_v1",
    "runtime_fres_heuristics_v1",
    "runtime_fres_balancing_v1",
    "runtime_fres_sustainability_v1",
    "runtime_fres_convergence_v1",
    "runtime_future_resilience_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_fres_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"fres-{name}")
    assert r["integrity_status"] == "ok"
