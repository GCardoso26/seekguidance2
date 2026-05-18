"""runtime_operational_recovery_mesh."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_operational_recovery_mesh"
_MODULES = [
    "runtime_operational_recovery_mesh_engine_v1",
    "runtime_recovery_mesh_registry_v1",
    "runtime_recovery_mesh_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_orm_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"orm-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
