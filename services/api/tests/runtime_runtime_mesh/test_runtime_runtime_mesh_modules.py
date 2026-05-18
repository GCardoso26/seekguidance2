"""runtime_runtime_mesh."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_runtime_mesh"
_MODULES = [
    "runtime_runtime_mesh_engine_v1",
    "runtime_mesh_routing_v1",
    "runtime_mesh_topology_v1",
    "runtime_mesh_coordination_v1",
    "runtime_mesh_federation_bridge_v1",
    "runtime_mesh_observability_bridge_v1",
    "runtime_mesh_execution_bridge_v1",
    "runtime_mesh_governance_v1",
    "runtime_mesh_health_v1",
    "runtime_mesh_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_mesh_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    fn = getattr(mod, f"{name}_stub", None)
    if fn is None and name.endswith("_engine_v1"):
        fn = getattr(mod, name)
    elif fn is None:
        fn = getattr(mod, f"{name}_stub")
    r = fn(f"mesh-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
