"""runtime_execution_fabric."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_execution_fabric"
_MODULES = [
    "runtime_execution_fabric_engine_v1",
    "runtime_fabric_routing_v1",
    "runtime_fabric_execution_v1",
    "runtime_fabric_replay_v1",
    "runtime_fabric_federation_v1",
    "runtime_fabric_observability_v1",
    "runtime_fabric_lifecycle_v1",
    "runtime_fabric_capability_v1",
    "runtime_fabric_convergence_v1",
    "runtime_fabric_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_fabric_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    fn = getattr(mod, f"{name}_stub", None)
    if fn is None and name.endswith("_engine_v1"):
        fn = getattr(mod, name)
    elif fn is None:
        fn = getattr(mod, f"{name}_stub")
    r = fn(f"fabric-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
