"""entropy stability."""
import importlib

import pytest

_PKG = "app.runtime.runtime_canonical"
_MODULES = [
    "runtime_entropy_stability_engine_v1",
    "runtime_arch_longevity_bridge_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_ens_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"ens-{name}")
    assert r["integrity_status"] == "ok"
