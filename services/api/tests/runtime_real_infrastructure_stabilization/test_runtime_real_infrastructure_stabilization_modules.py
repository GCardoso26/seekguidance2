"""runtime_real_infrastructure_stabilization."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_real_infrastructure"
_MODULES = [
    "runtime_real_infrastructure_stabilization_engine_v1",
    "runtime_deployment_staging_v1",
    "runtime_packaging_validation_v1",
    "runtime_deployment_integrity_v1",
    "runtime_deployment_freeze_v1",
    "runtime_ha_recovery_simulation_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_infrastab_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    fn = getattr(mod, f"{name}_stub", None)
    if fn is None and name.endswith("_engine_v1"):
        fn = getattr(mod, name)
    elif fn is None:
        fn = getattr(mod, f"{name}_stub")
    r = fn(f"infrastab-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
