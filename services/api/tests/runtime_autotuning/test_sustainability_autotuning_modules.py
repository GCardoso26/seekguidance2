"""sustainability autotuning modules."""
import importlib

import pytest

_PKG = "app.runtime.production_sustainability"
_MODULES = [
    "runtime_sustainability_autotuning_engine_v1",
    "runtime_pressure_normalization_v1",
    "runtime_storage_lifecycle_opt_v1",
    "runtime_cost_convergence_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_saut_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"saut-{name}")
    assert r["integrity_status"] == "ok"
