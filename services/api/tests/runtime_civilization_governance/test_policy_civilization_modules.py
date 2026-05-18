"""policy civilization."""
import importlib

import pytest

_PKG = "app.runtime.runtime_policy_coordination"
_MODULES = [
    "runtime_policy_civilization_engine_v1",
    "runtime_policy_civilization_intel_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_pcv_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"pcv-{name}")
    assert r["integrity_status"] == "ok"
