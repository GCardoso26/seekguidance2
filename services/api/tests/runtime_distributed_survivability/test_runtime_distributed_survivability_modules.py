"""runtime_distributed_survivability."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_distributed_survivability"
_MODULES = [
    "runtime_distributed_survivability_engine_v1",
    "runtime_survivability_registry_v1",
    "runtime_survivability_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_dsv_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"dsv-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
