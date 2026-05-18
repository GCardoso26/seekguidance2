"""adaptive recovery."""
import importlib

import pytest

_PKG = "app.runtime.runtime_recovery_coordination"
_MODULES = ["runtime_adaptive_recovery_engine_v1"]


@pytest.mark.parametrize("name", _MODULES)
def test_arec_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"arec-{name}")
    assert r["integrity_status"] == "ok"
