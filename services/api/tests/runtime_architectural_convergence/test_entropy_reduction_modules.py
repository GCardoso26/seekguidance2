"""entropy reduction."""
import importlib

import pytest

_PKG = "app.runtime.runtime_canonical"
_MODULES = [
    "runtime_entropy_reduction_engine_v1",
    "runtime_entropy_aware_arch_gov_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_enr_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"enr-{name}")
    assert r["integrity_status"] == "ok"
