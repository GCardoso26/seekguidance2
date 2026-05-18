"""complexity control."""
import importlib

import pytest

_PKG = "app.runtime.runtime_canonical"
_MODULES = [
    "runtime_operational_complexity_control_engine_v1",
    "runtime_institutional_arch_survivability_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_occ_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"occ-{name}")
    assert r["integrity_status"] == "ok"
